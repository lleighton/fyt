-- Migration: Add Group Stats Functions
-- RPC functions to get aggregated exercise totals for groups
-- Supports time filtering and variant scaling

-- ============================================
-- GET GROUP EXERCISE TOTALS
-- Returns aggregated stats per exercise for a group
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
      SUM(sc.scaled_value) AS total_val,
      COUNT(*) AS completion_count
    FROM scaled_completions sc
    GROUP BY sc.target_exercise_id
  ),
  user_totals AS (
    -- Get totals per user per exercise
    SELECT
      sc.target_exercise_id,
      sc.user_id,
      SUM(sc.scaled_value) AS user_val
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
    COALESCE(et.total_val, 0) AS total_value,
    COALESCE(et.completion_count, 0) AS total_completions,
    tc.user_id AS top_contributor_id,
    tc.display_name AS top_contributor_name,
    tc.avatar_url AS top_contributor_avatar,
    tc.user_val AS top_contributor_value
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
-- GET GROUP MEMBER CONTRIBUTIONS
-- Returns contribution totals per member for a group
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
      v_start_date := NULL; -- all time
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
      COALESCE(ev.parent_exercise_id, ct.exercise_id) AS target_exercise_id,
      CASE
        WHEN p_include_variants AND ev.parent_exercise_id IS NOT NULL
        THEN FLOOR(ct.completed_value * ev.scaling_factor)::BIGINT
        ELSE ct.completed_value::BIGINT
      END AS scaled_value
    FROM completed_tags ct
      LEFT JOIN exercise_variants ev ON ev.variant_exercise_id = ct.exercise_id
    WHERE (ev.parent_exercise_id IS NULL OR p_include_variants)
  )
  SELECT
    p.id AS user_id,
    p.display_name,
    p.avatar_url,
    COALESCE(SUM(sc.scaled_value), 0) AS total_value,
    COALESCE(COUNT(sc.*), 0) AS total_completions,
    COALESCE(COUNT(DISTINCT sc.target_exercise_id), 0) AS unique_exercises
  FROM group_members gm
    JOIN profiles p ON p.id = gm.user_id
    LEFT JOIN scaled_completions sc ON sc.recipient_id = p.id
  WHERE gm.group_id = p_group_id
  GROUP BY p.id, p.display_name, p.avatar_url
  ORDER BY total_value DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

-- ============================================
-- GET GROUP ACTIVITY SUMMARY
-- Returns overall group activity stats
-- ============================================
CREATE OR REPLACE FUNCTION get_group_activity_summary(
  p_group_id UUID,
  p_time_filter TEXT DEFAULT 'all'
)
RETURNS TABLE (
  total_completions BIGINT,
  total_reps BIGINT,
  total_seconds BIGINT,
  active_members BIGINT,
  unique_exercises BIGINT,
  active_goals BIGINT,
  completed_goals BIGINT
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
    SELECT
      tr.recipient_id,
      t.exercise_id,
      e.type AS exercise_type,
      tr.completed_value
    FROM tag_recipients tr
      JOIN tags t ON t.id = tr.tag_id
      JOIN exercises e ON e.id = t.exercise_id
    WHERE t.group_id = p_group_id
      AND tr.status = 'completed'
      AND tr.completed_value IS NOT NULL
      AND t.deleted = FALSE
      AND (v_start_date IS NULL OR tr.completed_at >= v_start_date)
  ),
  goals_stats AS (
    SELECT
      COUNT(*) FILTER (WHERE status = 'active' AND NOW() BETWEEN starts_at AND ends_at) AS active_count,
      COUNT(*) FILTER (WHERE status = 'completed') AS completed_count
    FROM group_goals
    WHERE group_id = p_group_id
  )
  SELECT
    COUNT(ct.*)::BIGINT AS total_completions,
    COALESCE(SUM(ct.completed_value) FILTER (WHERE ct.exercise_type = 'reps'), 0)::BIGINT AS total_reps,
    COALESCE(SUM(ct.completed_value) FILTER (WHERE ct.exercise_type = 'time'), 0)::BIGINT AS total_seconds,
    COUNT(DISTINCT ct.recipient_id)::BIGINT AS active_members,
    COUNT(DISTINCT ct.exercise_id)::BIGINT AS unique_exercises,
    COALESCE(gs.active_count, 0)::BIGINT AS active_goals,
    COALESCE(gs.completed_count, 0)::BIGINT AS completed_goals
  FROM completed_tags ct
    CROSS JOIN goals_stats gs
  GROUP BY gs.active_count, gs.completed_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

-- ============================================
-- GET ACTIVE GOALS FOR GROUP
-- Returns all active goals with progress
-- ============================================
CREATE OR REPLACE FUNCTION get_group_active_goals(p_group_id UUID)
RETURNS TABLE (
  goal_id UUID,
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
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  time_remaining INTERVAL,
  contributor_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    g.id AS goal_id,
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
    g.starts_at,
    g.ends_at,
    (g.ends_at - NOW()) AS time_remaining,
    (SELECT COUNT(DISTINCT gc.user_id) FROM goal_contributions gc WHERE gc.goal_id = g.id) AS contributor_count
  FROM group_goals g
    LEFT JOIN exercises e ON e.id = g.exercise_id
  WHERE g.group_id = p_group_id
    AND g.status = 'active'
    AND NOW() BETWEEN g.starts_at AND g.ends_at
  ORDER BY g.ends_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

-- ============================================
-- GET USER'S CONTRIBUTION TO GOALS
-- Returns user's contributions to group goals
-- ============================================
CREATE OR REPLACE FUNCTION get_user_goal_contributions(
  p_user_id UUID,
  p_group_id UUID
)
RETURNS TABLE (
  goal_id UUID,
  goal_title TEXT,
  user_contribution INTEGER,
  contribution_percent DECIMAL(5,2),
  rank_in_goal INTEGER
) AS $$
BEGIN
  RETURN QUERY
  WITH user_totals AS (
    SELECT
      gc.goal_id,
      SUM(gc.scaled_value)::INTEGER AS user_total
    FROM goal_contributions gc
      JOIN group_goals g ON g.id = gc.goal_id
    WHERE gc.user_id = p_user_id
      AND g.group_id = p_group_id
      AND g.status IN ('active', 'completed')
    GROUP BY gc.goal_id
  ),
  all_user_ranks AS (
    SELECT
      gc.goal_id,
      gc.user_id,
      SUM(gc.scaled_value) AS total,
      RANK() OVER (PARTITION BY gc.goal_id ORDER BY SUM(gc.scaled_value) DESC) AS rank
    FROM goal_contributions gc
    GROUP BY gc.goal_id, gc.user_id
  )
  SELECT
    g.id AS goal_id,
    g.title AS goal_title,
    COALESCE(ut.user_total, 0) AS user_contribution,
    ROUND((COALESCE(ut.user_total, 0)::DECIMAL / NULLIF(g.current_value, 0) * 100), 2) AS contribution_percent,
    COALESCE(aur.rank, 0)::INTEGER AS rank_in_goal
  FROM group_goals g
    LEFT JOIN user_totals ut ON ut.goal_id = g.id
    LEFT JOIN all_user_ranks aur ON aur.goal_id = g.id AND aur.user_id = p_user_id
  WHERE g.group_id = p_group_id
    AND g.status IN ('active', 'completed')
    AND NOW() <= g.ends_at + INTERVAL '7 days' -- Include recently ended
  ORDER BY g.status ASC, g.ends_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

-- ============================================
-- GET PAIR EXERCISE TOTALS
-- Similar to group but for 2-person interactions
-- ============================================
CREATE OR REPLACE FUNCTION get_pair_exercise_totals(
  p_user_id UUID,
  p_partner_id UUID,
  p_time_filter TEXT DEFAULT 'all',
  p_include_variants BOOLEAN DEFAULT TRUE
)
RETURNS TABLE (
  exercise_id UUID,
  exercise_name TEXT,
  exercise_icon TEXT,
  exercise_type TEXT,
  category TEXT,
  combined_total BIGINT,
  user_total BIGINT,
  partner_total BIGINT
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
    -- Tags between these two users (either direction)
    SELECT
      tr.recipient_id,
      t.exercise_id,
      tr.completed_value,
      tr.completed_at
    FROM tag_recipients tr
      JOIN tags t ON t.id = tr.tag_id
    WHERE (
        (t.sender_id = p_user_id AND tr.recipient_id = p_partner_id)
        OR (t.sender_id = p_partner_id AND tr.recipient_id = p_user_id)
        OR (t.sender_id = p_user_id AND tr.recipient_id = p_user_id)
        OR (t.sender_id = p_partner_id AND tr.recipient_id = p_partner_id)
      )
      AND tr.status = 'completed'
      AND tr.completed_value IS NOT NULL
      AND t.deleted = FALSE
      AND (v_start_date IS NULL OR tr.completed_at >= v_start_date)
  ),
  scaled_completions AS (
    SELECT
      ct.recipient_id,
      COALESCE(ev.parent_exercise_id, ct.exercise_id) AS target_exercise_id,
      CASE
        WHEN p_include_variants AND ev.parent_exercise_id IS NOT NULL
        THEN FLOOR(ct.completed_value * ev.scaling_factor)::BIGINT
        ELSE ct.completed_value::BIGINT
      END AS scaled_value
    FROM completed_tags ct
      LEFT JOIN exercise_variants ev ON ev.variant_exercise_id = ct.exercise_id
    WHERE (ev.parent_exercise_id IS NULL OR p_include_variants)
  )
  SELECT
    e.id AS exercise_id,
    e.name AS exercise_name,
    e.icon AS exercise_icon,
    e.type AS exercise_type,
    e.category,
    COALESCE(SUM(sc.scaled_value), 0) AS combined_total,
    COALESCE(SUM(sc.scaled_value) FILTER (WHERE sc.recipient_id = p_user_id), 0) AS user_total,
    COALESCE(SUM(sc.scaled_value) FILTER (WHERE sc.recipient_id = p_partner_id), 0) AS partner_total
  FROM exercises e
    LEFT JOIN scaled_completions sc ON sc.target_exercise_id = e.id
  WHERE e.is_active = TRUE
  GROUP BY e.id, e.name, e.icon, e.type, e.category
  HAVING COALESCE(SUM(sc.scaled_value), 0) > 0
  ORDER BY combined_total DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;
