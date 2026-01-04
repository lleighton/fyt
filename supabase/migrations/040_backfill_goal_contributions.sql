-- Migration: Backfill Goal Contributions
-- Fixes goals showing 0 progress by backfilling historical completions
-- and adds a function to manually recalculate goal progress

-- ============================================
-- FUNCTION: Backfill contributions for a specific goal
-- Call this after creating a goal to include historical completions
-- ============================================
CREATE OR REPLACE FUNCTION backfill_goal_contributions(p_goal_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_goal RECORD;
  v_count INTEGER := 0;
  v_exercise_id UUID;
  v_parent_exercise_id UUID;
  v_scaling DECIMAL(3,2);
  v_scaled_value INTEGER;
  v_tag_recipient RECORD;
BEGIN
  -- Get goal info
  SELECT * INTO v_goal
  FROM group_goals
  WHERE id = p_goal_id AND status = 'active';

  IF NOT FOUND THEN
    RETURN 0;
  END IF;

  -- Find all completed tag_recipients in this group during the goal period
  FOR v_tag_recipient IN
    SELECT
      tr.id AS tag_recipient_id,
      tr.recipient_id,
      tr.completed_value,
      tr.completed_at,
      t.exercise_id,
      e.category AS exercise_category
    FROM tag_recipients tr
      JOIN tags t ON t.id = tr.tag_id
      JOIN exercises e ON e.id = t.exercise_id
    WHERE t.group_id = v_goal.group_id
      AND tr.status = 'completed'
      AND tr.completed_value IS NOT NULL
      AND tr.completed_at >= v_goal.starts_at
      AND tr.completed_at <= v_goal.ends_at
      AND t.deleted = FALSE
  LOOP
    -- Check if this exercise is a variant
    SELECT parent_exercise_id, scaling_factor
    INTO v_parent_exercise_id, v_scaling
    FROM exercise_variants
    WHERE variant_exercise_id = v_tag_recipient.exercise_id;

    -- Check if this completion matches the goal
    IF v_goal.exercise_id IS NOT NULL THEN
      -- Specific exercise goal
      IF v_tag_recipient.exercise_id = v_goal.exercise_id THEN
        -- Direct match (1.0 scaling)
        INSERT INTO goal_contributions (goal_id, user_id, tag_recipient_id, exercise_id, raw_value, scaled_value, scaling_factor, contributed_at)
        VALUES (v_goal.id, v_tag_recipient.recipient_id, v_tag_recipient.tag_recipient_id, v_tag_recipient.exercise_id, v_tag_recipient.completed_value, v_tag_recipient.completed_value, 1.00, v_tag_recipient.completed_at)
        ON CONFLICT (goal_id, tag_recipient_id) DO NOTHING;
        v_count := v_count + 1;

      ELSIF v_goal.include_variants AND v_parent_exercise_id = v_goal.exercise_id THEN
        -- Variant match (apply scaling)
        v_scaled_value := FLOOR(v_tag_recipient.completed_value * v_scaling);
        IF v_scaled_value > 0 THEN
          INSERT INTO goal_contributions (goal_id, user_id, tag_recipient_id, exercise_id, raw_value, scaled_value, scaling_factor, contributed_at)
          VALUES (v_goal.id, v_tag_recipient.recipient_id, v_tag_recipient.tag_recipient_id, v_tag_recipient.exercise_id, v_tag_recipient.completed_value, v_scaled_value, v_scaling, v_tag_recipient.completed_at)
          ON CONFLICT (goal_id, tag_recipient_id) DO NOTHING;
          v_count := v_count + 1;
        END IF;
      END IF;

    ELSIF v_goal.category IS NOT NULL THEN
      -- Category goal
      IF v_goal.category = 'all' OR v_tag_recipient.exercise_category = v_goal.category THEN
        IF v_parent_exercise_id IS NULL OR NOT v_goal.include_variants THEN
          -- Not a variant, use full value
          INSERT INTO goal_contributions (goal_id, user_id, tag_recipient_id, exercise_id, raw_value, scaled_value, scaling_factor, contributed_at)
          VALUES (v_goal.id, v_tag_recipient.recipient_id, v_tag_recipient.tag_recipient_id, v_tag_recipient.exercise_id, v_tag_recipient.completed_value, v_tag_recipient.completed_value, 1.00, v_tag_recipient.completed_at)
          ON CONFLICT (goal_id, tag_recipient_id) DO NOTHING;
          v_count := v_count + 1;
        ELSE
          -- Is a variant and include_variants is true, apply scaling
          v_scaled_value := FLOOR(v_tag_recipient.completed_value * v_scaling);
          IF v_scaled_value > 0 THEN
            INSERT INTO goal_contributions (goal_id, user_id, tag_recipient_id, exercise_id, raw_value, scaled_value, scaling_factor, contributed_at)
            VALUES (v_goal.id, v_tag_recipient.recipient_id, v_tag_recipient.tag_recipient_id, v_tag_recipient.exercise_id, v_tag_recipient.completed_value, v_scaled_value, v_scaling, v_tag_recipient.completed_at)
            ON CONFLICT (goal_id, tag_recipient_id) DO NOTHING;
            v_count := v_count + 1;
          END IF;
        END IF;
      END IF;
    END IF;
  END LOOP;

  -- Recalculate the goal's current_value from contributions
  PERFORM recalculate_goal_progress(p_goal_id);

  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

-- ============================================
-- FUNCTION: Recalculate goal progress from contributions
-- ============================================
CREATE OR REPLACE FUNCTION recalculate_goal_progress(p_goal_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_current_total INTEGER;
  v_target INTEGER;
BEGIN
  -- Calculate total from contributions
  SELECT COALESCE(SUM(scaled_value), 0) INTO v_current_total
  FROM goal_contributions
  WHERE goal_id = p_goal_id;

  -- Get target value
  SELECT target_value INTO v_target
  FROM group_goals
  WHERE id = p_goal_id;

  -- Update the goal
  UPDATE group_goals
  SET
    current_value = v_current_total,
    status = CASE
      WHEN v_current_total >= v_target AND status = 'active' THEN 'completed'
      ELSE status
    END,
    completed_at = CASE
      WHEN v_current_total >= v_target AND status = 'active' AND completed_at IS NULL THEN NOW()
      ELSE completed_at
    END,
    updated_at = NOW()
  WHERE id = p_goal_id;

  RETURN v_current_total;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

-- ============================================
-- FUNCTION: Backfill ALL active goals in a group
-- ============================================
CREATE OR REPLACE FUNCTION backfill_all_group_goals(p_group_id UUID)
RETURNS TABLE (goal_id UUID, goal_title TEXT, contributions_added INTEGER) AS $$
DECLARE
  v_goal RECORD;
  v_count INTEGER;
BEGIN
  FOR v_goal IN
    SELECT id, title
    FROM group_goals
    WHERE group_id = p_group_id
      AND status = 'active'
      AND NOW() BETWEEN starts_at AND ends_at
  LOOP
    v_count := backfill_goal_contributions(v_goal.id);
    RETURN QUERY SELECT v_goal.id, v_goal.title, v_count;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

-- ============================================
-- Backfill all existing active goals NOW
-- ============================================
DO $$
DECLARE
  v_goal RECORD;
  v_count INTEGER;
BEGIN
  FOR v_goal IN
    SELECT id, title, group_id
    FROM group_goals
    WHERE status = 'active'
      AND NOW() BETWEEN starts_at AND ends_at
  LOOP
    v_count := backfill_goal_contributions(v_goal.id);
    RAISE NOTICE 'Backfilled goal "%": % contributions added', v_goal.title, v_count;
  END LOOP;
END $$;

-- ============================================
-- Update create_group_goal to auto-backfill
-- ============================================
CREATE OR REPLACE FUNCTION create_group_goal(
  p_group_id UUID,
  p_title TEXT,
  p_target_value INTEGER,
  p_target_unit TEXT,
  p_period_type TEXT,
  p_exercise_id UUID DEFAULT NULL,
  p_category TEXT DEFAULT NULL,
  p_description TEXT DEFAULT NULL,
  p_icon TEXT DEFAULT NULL,
  p_starts_at TIMESTAMPTZ DEFAULT NULL,
  p_ends_at TIMESTAMPTZ DEFAULT NULL,
  p_include_variants BOOLEAN DEFAULT TRUE
)
RETURNS UUID AS $$
DECLARE
  v_goal_id UUID;
  v_starts TIMESTAMPTZ;
  v_ends TIMESTAMPTZ;
BEGIN
  -- Calculate period dates if not provided
  IF p_starts_at IS NULL THEN
    v_starts := date_trunc('day', NOW());
  ELSE
    v_starts := p_starts_at;
  END IF;

  IF p_ends_at IS NULL THEN
    CASE p_period_type
      WHEN 'week' THEN
        v_ends := v_starts + INTERVAL '7 days';
      WHEN 'month' THEN
        v_ends := v_starts + INTERVAL '1 month';
      ELSE
        -- custom requires explicit end date
        RAISE EXCEPTION 'Custom period requires explicit end date';
    END CASE;
  ELSE
    v_ends := p_ends_at;
  END IF;

  INSERT INTO group_goals (
    group_id, title, description, icon,
    exercise_id, category,
    target_value, target_unit,
    period_type, starts_at, ends_at,
    include_variants, created_by
  ) VALUES (
    p_group_id, p_title, p_description, p_icon,
    p_exercise_id, p_category,
    p_target_value, p_target_unit,
    p_period_type, v_starts, v_ends,
    p_include_variants, auth.uid()
  )
  RETURNING id INTO v_goal_id;

  -- Auto-backfill historical completions for this goal
  PERFORM backfill_goal_contributions(v_goal_id);

  RETURN v_goal_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;
