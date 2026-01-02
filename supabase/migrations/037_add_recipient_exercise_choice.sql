-- Migration: Add Recipient Exercise Choice
-- Allows tag recipients to complete a tag using a variant exercise
-- e.g., Tagged with "50 Pushups" -> can do "100 Knee Pushups" (0.5x = 50 effective)

-- ============================================
-- ADD COMPLETED EXERCISE COLUMN
-- ============================================

-- Add column to track which exercise the recipient actually performed
ALTER TABLE tag_recipients
ADD COLUMN IF NOT EXISTS completed_exercise_id UUID REFERENCES exercises(id) ON DELETE SET NULL;

-- Add column to store the effective/scaled value (for quick lookups)
ALTER TABLE tag_recipients
ADD COLUMN IF NOT EXISTS scaled_value INTEGER;

-- Index for efficient queries
CREATE INDEX IF NOT EXISTS idx_tag_recipients_completed_exercise
ON tag_recipients(completed_exercise_id)
WHERE completed_exercise_id IS NOT NULL;

-- ============================================
-- HELPER FUNCTION: Calculate scaled completion
-- ============================================

-- Check if a completion meets the tag target (considering variant scaling)
CREATE OR REPLACE FUNCTION calculate_scaled_completion(
  p_tag_exercise_id UUID,        -- The exercise the sender tagged
  p_completed_exercise_id UUID,  -- The exercise the recipient performed
  p_completed_value INTEGER      -- Raw value the recipient achieved
)
RETURNS TABLE (
  is_valid BOOLEAN,              -- Can this exercise count toward the tag?
  scaling_factor DECIMAL(3,2),   -- The scaling factor applied
  scaled_value INTEGER,          -- The effective value after scaling
  is_same_exercise BOOLEAN       -- Did they do the exact same exercise?
) AS $$
DECLARE
  v_scaling DECIMAL(3,2) := 1.00;
  v_parent_id UUID;
BEGIN
  -- Same exercise = no scaling
  IF p_tag_exercise_id = p_completed_exercise_id THEN
    RETURN QUERY SELECT
      TRUE,
      1.00::DECIMAL(3,2),
      p_completed_value,
      TRUE;
    RETURN;
  END IF;

  -- Check if completed exercise is a variant of the tagged exercise
  SELECT ev.scaling_factor, ev.parent_exercise_id
  INTO v_scaling, v_parent_id
  FROM exercise_variants ev
  WHERE ev.variant_exercise_id = p_completed_exercise_id
    AND ev.parent_exercise_id = p_tag_exercise_id;

  IF v_parent_id IS NOT NULL THEN
    -- Completed exercise is a variant of the tagged exercise
    RETURN QUERY SELECT
      TRUE,
      v_scaling,
      FLOOR(p_completed_value * v_scaling)::INTEGER,
      FALSE;
    RETURN;
  END IF;

  -- Check if both exercises share the same parent (sibling variants)
  -- e.g., Knee Pushups and Wall Pushups both count toward Pushups
  -- But we don't allow cross-variant completion - must match the tag exercise

  -- Not a valid exercise for this tag
  RETURN QUERY SELECT
    FALSE,
    0.00::DECIMAL(3,2),
    0,
    FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

-- ============================================
-- HELPER FUNCTION: Get valid exercises for a tag
-- Returns the tagged exercise plus all its variants
-- ============================================
CREATE OR REPLACE FUNCTION get_valid_completion_exercises(p_tag_id UUID)
RETURNS TABLE (
  exercise_id UUID,
  exercise_name TEXT,
  exercise_icon TEXT,
  exercise_type TEXT,
  is_variant BOOLEAN,
  scaling_factor DECIMAL(3,2),
  effective_target INTEGER  -- What raw value is needed to meet the tag target
) AS $$
DECLARE
  v_tag_exercise_id UUID;
  v_tag_value INTEGER;
BEGIN
  -- Get the tag's exercise and target value
  SELECT t.exercise_id, t.value
  INTO v_tag_exercise_id, v_tag_value
  FROM tags t
  WHERE t.id = p_tag_id;

  IF v_tag_exercise_id IS NULL THEN
    RETURN;
  END IF;

  -- Return the original exercise (scaling = 1.0)
  RETURN QUERY
  SELECT
    e.id AS exercise_id,
    e.name AS exercise_name,
    e.icon AS exercise_icon,
    e.type AS exercise_type,
    FALSE AS is_variant,
    1.00::DECIMAL(3,2) AS scaling_factor,
    v_tag_value AS effective_target
  FROM exercises e
  WHERE e.id = v_tag_exercise_id
    AND e.is_active = TRUE;

  -- Return all variants of this exercise
  RETURN QUERY
  SELECT
    e.id AS exercise_id,
    e.name AS exercise_name,
    e.icon AS exercise_icon,
    e.type AS exercise_type,
    TRUE AS is_variant,
    ev.scaling_factor,
    CEIL(v_tag_value / ev.scaling_factor)::INTEGER AS effective_target
  FROM exercise_variants ev
    JOIN exercises e ON e.id = ev.variant_exercise_id
  WHERE ev.parent_exercise_id = v_tag_exercise_id
    AND e.is_active = TRUE
  ORDER BY ev.scaling_factor DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

-- ============================================
-- UPDATE: Auto-add goal contribution trigger
-- Now uses completed_exercise_id instead of tag exercise
-- ============================================
CREATE OR REPLACE FUNCTION auto_add_goal_contribution()
RETURNS TRIGGER AS $$
DECLARE
  v_goal RECORD;
  v_exercise_id UUID;
  v_exercise_category TEXT;
  v_parent_exercise_id UUID;
  v_scaling DECIMAL(3,2);
  v_scaled_value INTEGER;
  v_group_id UUID;
BEGIN
  -- Only process when tag is completed
  IF NEW.status != 'completed' OR NEW.completed_value IS NULL THEN
    RETURN NEW;
  END IF;

  -- Use completed_exercise_id if set, otherwise fall back to tag's exercise
  IF NEW.completed_exercise_id IS NOT NULL THEN
    v_exercise_id := NEW.completed_exercise_id;
  ELSE
    SELECT t.exercise_id INTO v_exercise_id
    FROM tags t WHERE t.id = NEW.tag_id;
  END IF;

  -- Get the tag's group and exercise category
  SELECT t.group_id, e.category
  INTO v_group_id, v_exercise_category
  FROM tags t
    JOIN exercises e ON e.id = v_exercise_id
  WHERE t.id = NEW.tag_id;

  -- If no group, no goals to update
  IF v_group_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Check if this exercise is a variant
  SELECT parent_exercise_id, scaling_factor
  INTO v_parent_exercise_id, v_scaling
  FROM exercise_variants
  WHERE variant_exercise_id = v_exercise_id;

  -- Find matching active goals for this group
  FOR v_goal IN
    SELECT g.id, g.exercise_id, g.category, g.include_variants
    FROM group_goals g
    WHERE g.group_id = v_group_id
      AND g.status = 'active'
      AND NOW() BETWEEN g.starts_at AND g.ends_at
  LOOP
    IF v_goal.exercise_id IS NOT NULL THEN
      -- Specific exercise goal
      IF v_exercise_id = v_goal.exercise_id THEN
        -- Direct match (1.0 scaling)
        INSERT INTO goal_contributions (goal_id, user_id, tag_recipient_id, exercise_id, raw_value, scaled_value, scaling_factor)
        VALUES (v_goal.id, NEW.recipient_id, NEW.id, v_exercise_id, NEW.completed_value, NEW.completed_value, 1.00)
        ON CONFLICT (goal_id, tag_recipient_id) DO NOTHING;

      ELSIF v_goal.include_variants AND v_parent_exercise_id = v_goal.exercise_id THEN
        -- Variant match (apply scaling)
        v_scaled_value := FLOOR(NEW.completed_value * v_scaling);
        IF v_scaled_value > 0 THEN
          INSERT INTO goal_contributions (goal_id, user_id, tag_recipient_id, exercise_id, raw_value, scaled_value, scaling_factor)
          VALUES (v_goal.id, NEW.recipient_id, NEW.id, v_exercise_id, NEW.completed_value, v_scaled_value, v_scaling)
          ON CONFLICT (goal_id, tag_recipient_id) DO NOTHING;
        END IF;
      END IF;

    ELSIF v_goal.category IS NOT NULL THEN
      -- Category goal
      IF v_goal.category = 'all' OR v_exercise_category = v_goal.category THEN
        IF v_parent_exercise_id IS NULL OR NOT v_goal.include_variants THEN
          -- Not a variant, use full value
          INSERT INTO goal_contributions (goal_id, user_id, tag_recipient_id, exercise_id, raw_value, scaled_value, scaling_factor)
          VALUES (v_goal.id, NEW.recipient_id, NEW.id, v_exercise_id, NEW.completed_value, NEW.completed_value, 1.00)
          ON CONFLICT (goal_id, tag_recipient_id) DO NOTHING;
        ELSE
          -- Is a variant, apply scaling
          v_scaled_value := FLOOR(NEW.completed_value * v_scaling);
          IF v_scaled_value > 0 THEN
            INSERT INTO goal_contributions (goal_id, user_id, tag_recipient_id, exercise_id, raw_value, scaled_value, scaling_factor)
            VALUES (v_goal.id, NEW.recipient_id, NEW.id, v_exercise_id, NEW.completed_value, v_scaled_value, v_scaling)
            ON CONFLICT (goal_id, tag_recipient_id) DO NOTHING;
          END IF;
        END IF;
      END IF;
    END IF;
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

-- ============================================
-- TRIGGER: Auto-calculate scaled_value on completion
-- ============================================
CREATE OR REPLACE FUNCTION calculate_recipient_scaled_value()
RETURNS TRIGGER AS $$
DECLARE
  v_tag_exercise_id UUID;
  v_completed_exercise_id UUID;
  v_scaling DECIMAL(3,2);
BEGIN
  -- Only calculate when completing
  IF NEW.status != 'completed' OR NEW.completed_value IS NULL THEN
    RETURN NEW;
  END IF;

  -- Get the tag's exercise
  SELECT exercise_id INTO v_tag_exercise_id
  FROM tags WHERE id = NEW.tag_id;

  -- Determine which exercise was completed
  v_completed_exercise_id := COALESCE(NEW.completed_exercise_id, v_tag_exercise_id);

  -- Calculate scaling
  IF v_completed_exercise_id = v_tag_exercise_id THEN
    -- Same exercise, no scaling
    NEW.scaled_value := NEW.completed_value;
  ELSE
    -- Check if it's a valid variant
    SELECT ev.scaling_factor INTO v_scaling
    FROM exercise_variants ev
    WHERE ev.variant_exercise_id = v_completed_exercise_id
      AND ev.parent_exercise_id = v_tag_exercise_id;

    IF v_scaling IS NOT NULL THEN
      NEW.scaled_value := FLOOR(NEW.completed_value * v_scaling);
    ELSE
      -- Not a valid variant - this shouldn't happen if UI validates
      NEW.scaled_value := 0;
    END IF;
  END IF;

  -- Also set the completed_exercise_id if not already set
  IF NEW.completed_exercise_id IS NULL THEN
    NEW.completed_exercise_id := v_tag_exercise_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

-- Create trigger (runs BEFORE so we can modify NEW)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'calculate_scaled_value_on_completion') THEN
    CREATE TRIGGER calculate_scaled_value_on_completion
    BEFORE INSERT OR UPDATE OF status, completed_value, completed_exercise_id ON tag_recipients
    FOR EACH ROW EXECUTE FUNCTION calculate_recipient_scaled_value();
  END IF;
END $$;

-- ============================================
-- GRANT PERMISSIONS
-- ============================================
GRANT EXECUTE ON FUNCTION calculate_scaled_completion(UUID, UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_valid_completion_exercises(UUID) TO authenticated;
