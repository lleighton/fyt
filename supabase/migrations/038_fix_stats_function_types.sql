-- Migration: Fix type mismatches in stats functions
-- SUM() returns NUMERIC, but we declared BIGINT return types
-- Add explicit casts to fix the mismatch

-- ============================================
-- FIX: get_group_exercise_totals
-- ============================================
CREATE OR REPLACE FUNCTION get_group_exercise_totals(
  p_group_id UUID,
  p_time_filter TEXT DEFAULT 'all', -- 'week', 'month', 'all'
  p_include_variants BOOLEAN DEFAULT TRUE
)
RETURNS TABLE (
  exercise_id UUID,
  exercise_name TEXT,
  exercise_icon TEXT,
  exercise_type TEXT,
  exercise_unit TEXT,
  category TEXT,
  total_value BIGINT,
  total_completions BIGINT,
  top_contributor_id UUID,
  top_contributor_name TEXT,
  top_contributor_avatar TEXT,
  top_contributor_value BIGINT
) AS $$
DECLARE
  v_start_date TIMESTAMPTZ;
BEGIN
  -- Calculate start date based on filter
  CASE p_time_filter
    WHEN 'week' THEN
      v_start_date := date_trunc('week', NOW());
    WHEN 'month' THEN
      v_start_date := date_trunc('month', NOW());
    ELSE
      v_start_date := NULL; -- all time
  END CASE;

  RETURN QUERY
  WITH completed_tags AS (
    -- Get all completed tag_recipients in this group
    SELECT
      tr.recipient_id AS user_id,
      t.exercise_id,
      tr.completed_value,
      tr.completed_at
    FROM tag_recipients tr
      JOIN tags t ON t.id = tr.tag_id
    WHERE t.group_id = p_group_id
      AND tr.status = 'completed'
      AND tr.completed_value IS NOT NULL
      AND t.deleted = FALSE
      AND (v_start_date IS NULL OR tr.completed_at >= v_start_date)
  ),
  scaled_completions AS (
    -- Apply variant scaling where applicable
    SELECT
      ct.user_id,
      COALESCE(ev.parent_exercise_id, ct.exercise_id) AS target_exercise_id,
      ct.exercise_id AS original_exercise_id,
      CASE
        WHEN p_include_variants AND ev.parent_exercise_id IS NOT NULL
        THEN FLOOR(ct.completed_value * ev.scaling_factor)::BIGINT
        ELSE ct.completed_value::BIGINT
      END AS scaled_value,
      ct.completed_at
    FROM completed_tags ct
      LEFT JOIN exercise_variants ev ON ev.variant_exercise_id = ct.exercise_id
    WHERE (ev.parent_exercise_id IS NULL OR p_include_variants)
  ),
  exercise_totals AS (
    -- Aggregate by exercise
    SELECT
      sc.target_exercise_id,
      SUM(sc.scaled_value)::BIGINT AS total_val,
      COUNT(*)::BIGINT AS completion_count
    FROM scaled_completions sc
    GROUP BY sc.target_exercise_id
  ),
  user_totals AS (
    -- Get totals per user per exercise
    SELECT
      sc.target_exercise_id,
      sc.user_id,
      SUM(sc.scaled_value)::BIGINT AS user_val
    FROM scaled_completions sc
    GROUP BY sc.target_exercise_id, sc.user_id
  ),
  top_contributors AS (
    -- Get top contributor for each exercise
    SELECT DISTINCT ON (ut.target_exercise_id)
      ut.target_exercise_id,
      ut.user_id,
      ut.user_val,
      p.display_name,
      p.avatar_url
    FROM user_totals ut
      JOIN profiles p ON p.id = ut.user_id
    ORDER BY ut.target_exercise_id, ut.user_val DESC
  )
  SELECT
    e.id AS exercise_id,
    e.name AS exercise_name,
    e.icon AS exercise_icon,
    e.type AS exercise_type,
    e.unit AS exercise_unit,
    e.category,
    COALESCE(et.total_val, 0::BIGINT) AS total_value,
    COALESCE(et.completion_count, 0::BIGINT) AS total_completions,
    tc.user_id AS top_contributor_id,
    tc.display_name AS top_contributor_name,
    tc.avatar_url AS top_contributor_avatar,
    COALESCE(tc.user_val, 0::BIGINT) AS top_contributor_value
  FROM exercises e
    LEFT JOIN exercise_totals et ON et.target_exercise_id = e.id
    LEFT JOIN top_contributors tc ON tc.target_exercise_id = e.id
  WHERE e.is_active = TRUE
    AND COALESCE(et.total_val, 0) > 0
  ORDER BY COALESCE(et.total_val, 0) DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

-- ============================================
-- FIX: get_group_member_stats
-- ============================================
CREATE OR REPLACE FUNCTION get_group_member_stats(
  p_group_id UUID,
  p_time_filter TEXT DEFAULT 'all',
  p_include_variants BOOLEAN DEFAULT TRUE
)
RETURNS TABLE (
  user_id UUID,
  display_name TEXT,
  avatar_url TEXT,
  total_value BIGINT,
  total_completions BIGINT,
  unique_exercises BIGINT
) AS $$
DECLARE
  v_start_date TIMESTAMPTZ;
BEGIN
  -- Calculate start date based on filter
  CASE p_time_filter
    WHEN 'week' THEN
      v_start_date := date_trunc('week', NOW());
    WHEN 'month' THEN
      v_start_date := date_trunc('month', NOW());
    ELSE
      v_start_date := NULL;
  END CASE;

  RETURN QUERY
  WITH completed_tags AS (
    SELECT
      tr.recipient_id,
      t.exercise_id,
      tr.completed_value,
      tr.completed_at
    FROM tag_recipients tr
      JOIN tags t ON t.id = tr.tag_id
    WHERE t.group_id = p_group_id
      AND tr.status = 'completed'
      AND tr.completed_value IS NOT NULL
      AND t.deleted = FALSE
      AND (v_start_date IS NULL OR tr.completed_at >= v_start_date)
  ),
  scaled_completions AS (
    SELECT
      ct.recipient_id,
      ct.exercise_id,
      CASE
        WHEN p_include_variants AND ev.parent_exercise_id IS NOT NULL
        THEN FLOOR(ct.completed_value * ev.scaling_factor)::BIGINT
        ELSE ct.completed_value::BIGINT
      END AS scaled_value
    FROM completed_tags ct
      LEFT JOIN exercise_variants ev ON ev.variant_exercise_id = ct.exercise_id
  )
  SELECT
    gm.user_id,
    p.display_name,
    p.avatar_url,
    COALESCE(SUM(sc.scaled_value), 0::BIGINT)::BIGINT AS total_value,
    COUNT(sc.scaled_value)::BIGINT AS total_completions,
    COUNT(DISTINCT sc.exercise_id)::BIGINT AS unique_exercises
  FROM group_members gm
    JOIN profiles p ON p.id = gm.user_id
    LEFT JOIN scaled_completions sc ON sc.recipient_id = gm.user_id
  WHERE gm.group_id = p_group_id
  GROUP BY gm.user_id, p.display_name, p.avatar_url
  ORDER BY total_value DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

-- ============================================
-- FIX: get_goal_progress
-- ============================================
CREATE OR REPLACE FUNCTION get_goal_progress(p_goal_id UUID)
RETURNS TABLE (
  goal_id UUID,
  current_value BIGINT,
  target_value BIGINT,
  percentage NUMERIC,
  contributor_count BIGINT,
  top_contributors JSONB
) AS $$
BEGIN
  RETURN QUERY
  WITH goal_info AS (
    SELECT
      g.id,
      g.target_value,
      g.exercise_id,
      g.category,
      g.include_variants,
      g.group_id
    FROM group_goals g
    WHERE g.id = p_goal_id
  ),
  contributions AS (
    SELECT
      gc.user_id,
      SUM(gc.scaled_value)::BIGINT AS total_contribution,
      COUNT(*)::BIGINT AS contribution_count
    FROM goal_contributions gc
    WHERE gc.goal_id = p_goal_id
    GROUP BY gc.user_id
  ),
  total_progress AS (
    SELECT
      COALESCE(SUM(c.total_contribution), 0::BIGINT)::BIGINT AS current_val,
      COUNT(DISTINCT c.user_id)::BIGINT AS contrib_count
    FROM contributions c
  ),
  top_contribs AS (
    SELECT jsonb_agg(
      jsonb_build_object(
        'user_id', c.user_id,
        'display_name', p.display_name,
        'contribution', c.total_contribution
      )
      ORDER BY c.total_contribution DESC
    ) AS contribs
    FROM contributions c
      JOIN profiles p ON p.id = c.user_id
    LIMIT 5
  )
  SELECT
    gi.id AS goal_id,
    tp.current_val AS current_value,
    gi.target_value::BIGINT AS target_value,
    ROUND((tp.current_val::NUMERIC / NULLIF(gi.target_value, 0)) * 100, 1) AS percentage,
    tp.contrib_count AS contributor_count,
    COALESCE(tc.contribs, '[]'::JSONB) AS top_contributors
  FROM goal_info gi
    CROSS JOIN total_progress tp
    LEFT JOIN top_contribs tc ON TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;
