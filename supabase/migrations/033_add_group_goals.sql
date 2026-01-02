-- Migration: Add Group Goals
-- Allows groups to set collaborative fitness targets
-- e.g., "10,000 pushups this month" with progress tracking

-- ============================================
-- GROUP GOALS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS group_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,

  -- Target definition
  exercise_id UUID REFERENCES exercises(id) ON DELETE SET NULL, -- NULL = any exercise in category
  category TEXT CHECK (category IN ('upper_body', 'core', 'lower_body', 'full_body', 'all')),
  target_value INTEGER NOT NULL CHECK (target_value > 0),
  target_unit TEXT NOT NULL CHECK (target_unit IN ('reps', 'seconds', 'completions')),

  -- Time period
  period_type TEXT NOT NULL CHECK (period_type IN ('week', 'month', 'custom')),
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,

  -- Display info
  title TEXT NOT NULL,
  description TEXT,
  icon TEXT, -- optional custom emoji

  -- Settings
  include_variants BOOLEAN DEFAULT TRUE, -- count scaled variants toward goal
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE SET NULL,

  -- Progress tracking (cached, updated by triggers)
  current_value INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ, -- when target was reached

  -- Validation
  CHECK (ends_at > starts_at),
  CHECK (
    (exercise_id IS NOT NULL AND category IS NULL) OR
    (exercise_id IS NULL AND category IS NOT NULL)
  )
);

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_group_goals_group ON group_goals(group_id);
CREATE INDEX IF NOT EXISTS idx_group_goals_status ON group_goals(status, group_id);
CREATE INDEX IF NOT EXISTS idx_group_goals_exercise ON group_goals(exercise_id) WHERE exercise_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_group_goals_period ON group_goals(starts_at, ends_at);

-- Auto-update timestamps
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_updated_at_group_goals') THEN
    CREATE TRIGGER set_updated_at_group_goals
    BEFORE UPDATE ON group_goals
    FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
  END IF;
END $$;

-- ============================================
-- GOAL CONTRIBUTIONS TABLE
-- Tracks individual member contributions to goals
-- ============================================
CREATE TABLE IF NOT EXISTS goal_contributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id UUID NOT NULL REFERENCES group_goals(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  tag_recipient_id UUID REFERENCES tag_recipients(id) ON DELETE SET NULL, -- links to completion
  exercise_id UUID REFERENCES exercises(id) ON DELETE SET NULL,

  -- Contribution value
  raw_value INTEGER NOT NULL CHECK (raw_value > 0), -- original value
  scaled_value INTEGER NOT NULL, -- after variant scaling applied
  scaling_factor DECIMAL(3,2) DEFAULT 1.00,

  contributed_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Prevent double-counting the same completion
  UNIQUE(goal_id, tag_recipient_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_goal_contributions_goal ON goal_contributions(goal_id);
CREATE INDEX IF NOT EXISTS idx_goal_contributions_user ON goal_contributions(user_id, goal_id);
CREATE INDEX IF NOT EXISTS idx_goal_contributions_date ON goal_contributions(contributed_at);

-- ============================================
-- TRIGGER: Update goal progress on contribution
-- ============================================
CREATE OR REPLACE FUNCTION update_goal_progress()
RETURNS TRIGGER AS $$
DECLARE
  v_current_total INTEGER;
  v_target INTEGER;
BEGIN
  -- Calculate new total for the goal
  SELECT COALESCE(SUM(scaled_value), 0) INTO v_current_total
  FROM goal_contributions
  WHERE goal_id = NEW.goal_id;

  -- Get target value
  SELECT target_value INTO v_target
  FROM group_goals
  WHERE id = NEW.goal_id;

  -- Update the goal's cached progress
  UPDATE group_goals
  SET
    current_value = v_current_total,
    status = CASE
      WHEN v_current_total >= v_target AND status = 'active' THEN 'completed'
      ELSE status
    END,
    completed_at = CASE
      WHEN v_current_total >= v_target AND status = 'active' THEN NOW()
      ELSE completed_at
    END,
    updated_at = NOW()
  WHERE id = NEW.goal_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_goal_progress_on_contribution') THEN
    CREATE TRIGGER update_goal_progress_on_contribution
    AFTER INSERT ON goal_contributions
    FOR EACH ROW EXECUTE FUNCTION update_goal_progress();
  END IF;
END $$;

-- ============================================
-- TRIGGER: Auto-add contributions when tag is completed
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

  -- Get the tag's exercise and group info
  SELECT t.exercise_id, t.group_id, e.category
  INTO v_exercise_id, v_group_id, v_exercise_category
  FROM tags t
    JOIN exercises e ON e.id = t.exercise_id
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
    -- Check if this completion matches the goal
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
        -- Match by category (use full value unless it's a variant)
        IF v_parent_exercise_id IS NULL OR NOT v_goal.include_variants THEN
          -- Not a variant, use full value
          INSERT INTO goal_contributions (goal_id, user_id, tag_recipient_id, exercise_id, raw_value, scaled_value, scaling_factor)
          VALUES (v_goal.id, NEW.recipient_id, NEW.id, v_exercise_id, NEW.completed_value, NEW.completed_value, 1.00)
          ON CONFLICT (goal_id, tag_recipient_id) DO NOTHING;
        ELSE
          -- Is a variant and include_variants is true, apply scaling
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

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'auto_add_goal_contribution_on_completion') THEN
    CREATE TRIGGER auto_add_goal_contribution_on_completion
    AFTER INSERT OR UPDATE OF status, completed_value ON tag_recipients
    FOR EACH ROW EXECUTE FUNCTION auto_add_goal_contribution();
  END IF;
END $$;

-- ============================================
-- REALTIME
-- ============================================
ALTER PUBLICATION supabase_realtime ADD TABLE group_goals;
ALTER PUBLICATION supabase_realtime ADD TABLE goal_contributions;

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Get goal with contributor breakdown
CREATE OR REPLACE FUNCTION get_goal_details(p_goal_id UUID)
RETURNS TABLE (
  goal_id UUID,
  group_id UUID,
  title TEXT,
  description TEXT,
  icon TEXT,
  exercise_id UUID,
  exercise_name TEXT,
  exercise_icon TEXT,
  category TEXT,
  target_value INTEGER,
  target_unit TEXT,
  current_value INTEGER,
  progress_percent DECIMAL(5,2),
  status TEXT,
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  created_by UUID,
  created_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  include_variants BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    g.id AS goal_id,
    g.group_id,
    g.title,
    g.description,
    g.icon,
    g.exercise_id,
    e.name AS exercise_name,
    e.icon AS exercise_icon,
    g.category,
    g.target_value,
    g.target_unit,
    g.current_value,
    ROUND((g.current_value::DECIMAL / g.target_value * 100), 2) AS progress_percent,
    g.status,
    g.starts_at,
    g.ends_at,
    g.created_by,
    g.created_at,
    g.completed_at,
    g.include_variants
  FROM group_goals g
    LEFT JOIN exercises e ON e.id = g.exercise_id
  WHERE g.id = p_goal_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

-- Get top contributors for a goal
CREATE OR REPLACE FUNCTION get_goal_contributors(
  p_goal_id UUID,
  p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
  user_id UUID,
  display_name TEXT,
  avatar_url TEXT,
  total_contribution INTEGER,
  contribution_count INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    gc.user_id,
    p.display_name,
    p.avatar_url,
    SUM(gc.scaled_value)::INTEGER AS total_contribution,
    COUNT(gc.id)::INTEGER AS contribution_count
  FROM goal_contributions gc
    JOIN profiles p ON p.id = gc.user_id
  WHERE gc.goal_id = p_goal_id
  GROUP BY gc.user_id, p.display_name, p.avatar_url
  ORDER BY total_contribution DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

-- Create a new goal (admin only - RLS will enforce)
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

  RETURN v_goal_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

-- Cancel a goal
CREATE OR REPLACE FUNCTION cancel_group_goal(p_goal_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE group_goals
  SET status = 'cancelled', updated_at = NOW()
  WHERE id = p_goal_id
    AND status = 'active';

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;
