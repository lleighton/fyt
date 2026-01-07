-- Migration: Add group leaderboard views and functions
-- This creates materialized views for efficient group leaderboard queries

-- ============================================================================
-- View: Group Member Leaderboard
-- Shows aggregated stats for all members of a group
-- ============================================================================
CREATE OR REPLACE VIEW group_member_stats AS
SELECT
  gm.group_id,
  gm.user_id,
  gm.role,
  p.display_name,
  p.avatar_url,

  -- Total completions across all challenges
  COUNT(DISTINCT c.id) FILTER (WHERE c.deleted = false) AS total_completions,

  -- Total completions for group challenges only
  COUNT(DISTINCT c.id) FILTER (
    WHERE c.deleted = false
    AND ch.group_id = gm.group_id
  ) AS group_challenge_completions,

  -- Total points (sum of all completion values)
  COALESCE(SUM(c.value) FILTER (WHERE c.deleted = false), 0) AS total_points,

  -- Total points for group challenges only
  COALESCE(
    SUM(c.value) FILTER (
      WHERE c.deleted = false
      AND ch.group_id = gm.group_id
    ),
    0
  ) AS group_challenge_points,

  -- Average performance (average completion value)
  COALESCE(
    AVG(c.value) FILTER (WHERE c.deleted = false),
    0
  ) AS avg_performance,

  -- Number of challenges participated in
  COUNT(DISTINCT cp.challenge_id) AS challenges_participated,

  -- Number of group challenges participated in
  COUNT(DISTINCT cp.challenge_id) FILTER (
    WHERE ch.group_id = gm.group_id
  ) AS group_challenges_participated,

  -- Latest completion date
  MAX(c.completed_at) AS last_completion_at,

  -- Member since
  gm.created_at AS member_since

FROM group_members gm
  LEFT JOIN profiles p ON p.id = gm.user_id
  LEFT JOIN challenge_participants cp ON cp.user_id = gm.user_id
  LEFT JOIN challenges ch ON ch.id = cp.challenge_id
  LEFT JOIN completions c ON c.user_id = gm.user_id AND c.challenge_id = ch.id

GROUP BY
  gm.group_id,
  gm.user_id,
  gm.role,
  p.display_name,
  p.avatar_url,
  gm.created_at;

-- ============================================================================
-- Function: Get Group Leaderboard with Time Filter
-- Returns ranked members for a specific group with optional time filtering
-- ============================================================================
CREATE OR REPLACE FUNCTION get_group_leaderboard(
  p_group_id UUID,
  p_time_filter TEXT DEFAULT 'all_time' -- 'week', 'month', 'all_time'
)
RETURNS TABLE (
  user_id UUID,
  display_name TEXT,
  avatar_url TEXT,
  role TEXT,
  total_completions BIGINT,
  group_challenge_completions BIGINT,
  total_points NUMERIC,
  group_challenge_points NUMERIC,
  avg_performance NUMERIC,
  challenges_participated BIGINT,
  group_challenges_participated BIGINT,
  last_completion_at TIMESTAMPTZ,
  member_since TIMESTAMPTZ,
  rank BIGINT
) AS $$
DECLARE
  time_threshold TIMESTAMPTZ;
BEGIN
  -- Calculate time threshold based on filter
  CASE p_time_filter
    WHEN 'week' THEN
      time_threshold := NOW() - INTERVAL '7 days';
    WHEN 'month' THEN
      time_threshold := NOW() - INTERVAL '30 days';
    ELSE
      time_threshold := NULL; -- all_time
  END CASE;

  RETURN QUERY
  WITH member_stats AS (
    SELECT
      gm.user_id,
      p.display_name,
      p.avatar_url,
      gm.role,

      -- Total completions (filtered by time)
      COUNT(DISTINCT c.id) FILTER (
        WHERE c.deleted = false
        AND (time_threshold IS NULL OR c.completed_at >= time_threshold)
      ) AS total_completions,

      -- Group challenge completions (filtered by time)
      COUNT(DISTINCT c.id) FILTER (
        WHERE c.deleted = false
        AND ch.group_id = p_group_id
        AND (time_threshold IS NULL OR c.completed_at >= time_threshold)
      ) AS group_challenge_completions,

      -- Total points (filtered by time)
      COALESCE(
        SUM(c.value) FILTER (
          WHERE c.deleted = false
          AND (time_threshold IS NULL OR c.completed_at >= time_threshold)
        ),
        0
      ) AS total_points,

      -- Group challenge points (filtered by time)
      COALESCE(
        SUM(c.value) FILTER (
          WHERE c.deleted = false
          AND ch.group_id = p_group_id
          AND (time_threshold IS NULL OR c.completed_at >= time_threshold)
        ),
        0
      ) AS group_challenge_points,

      -- Average performance (filtered by time)
      COALESCE(
        AVG(c.value) FILTER (
          WHERE c.deleted = false
          AND (time_threshold IS NULL OR c.completed_at >= time_threshold)
        ),
        0
      ) AS avg_performance,

      -- Challenges participated
      COUNT(DISTINCT cp.challenge_id) FILTER (
        WHERE time_threshold IS NULL
        OR EXISTS (
          SELECT 1 FROM completions cc
          WHERE cc.challenge_id = cp.challenge_id
          AND cc.user_id = gm.user_id
          AND cc.completed_at >= time_threshold
        )
      ) AS challenges_participated,

      -- Group challenges participated
      COUNT(DISTINCT cp.challenge_id) FILTER (
        WHERE ch.group_id = p_group_id
        AND (
          time_threshold IS NULL
          OR EXISTS (
            SELECT 1 FROM completions cc
            WHERE cc.challenge_id = cp.challenge_id
            AND cc.user_id = gm.user_id
            AND cc.completed_at >= time_threshold
          )
        )
      ) AS group_challenges_participated,

      -- Latest completion
      MAX(c.completed_at) FILTER (
        WHERE time_threshold IS NULL OR c.completed_at >= time_threshold
      ) AS last_completion_at,

      -- Member since
      gm.created_at AS member_since

    FROM group_members gm
      LEFT JOIN profiles p ON p.id = gm.user_id
      LEFT JOIN challenge_participants cp ON cp.user_id = gm.user_id
      LEFT JOIN challenges ch ON ch.id = cp.challenge_id
      LEFT JOIN completions c ON c.user_id = gm.user_id AND c.challenge_id = ch.id

    WHERE gm.group_id = p_group_id

    GROUP BY
      gm.user_id,
      p.display_name,
      p.avatar_url,
      gm.role,
      gm.created_at
  )
  SELECT
    ms.*,
    ROW_NUMBER() OVER (
      ORDER BY
        ms.group_challenge_points DESC,
        ms.group_challenge_completions DESC,
        ms.total_points DESC,
        ms.total_completions DESC
    ) AS rank
  FROM member_stats ms
  ORDER BY rank;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- Function: Get Group Aggregate Stats
-- Returns overall group statistics
-- ============================================================================
CREATE OR REPLACE FUNCTION get_group_aggregate_stats(
  p_group_id UUID,
  p_time_filter TEXT DEFAULT 'all_time'
)
RETURNS TABLE (
  total_members BIGINT,
  total_completions BIGINT,
  total_group_challenge_completions BIGINT,
  total_points NUMERIC,
  avg_completions_per_member NUMERIC,
  most_active_member_id UUID,
  most_active_member_name TEXT,
  most_active_member_completions BIGINT
) AS $$
DECLARE
  time_threshold TIMESTAMPTZ;
BEGIN
  -- Calculate time threshold based on filter
  CASE p_time_filter
    WHEN 'week' THEN
      time_threshold := NOW() - INTERVAL '7 days';
    WHEN 'month' THEN
      time_threshold := NOW() - INTERVAL '30 days';
    ELSE
      time_threshold := NULL;
  END CASE;

  RETURN QUERY
  WITH member_completions AS (
    SELECT
      gm.user_id,
      p.display_name,
      COUNT(DISTINCT c.id) FILTER (
        WHERE c.deleted = false
        AND (time_threshold IS NULL OR c.completed_at >= time_threshold)
      ) AS completion_count
    FROM group_members gm
      LEFT JOIN profiles p ON p.id = gm.user_id
      LEFT JOIN completions c ON c.user_id = gm.user_id
    WHERE gm.group_id = p_group_id
    GROUP BY gm.user_id, p.display_name
  ),
  most_active AS (
    SELECT user_id, display_name, completion_count
    FROM member_completions
    ORDER BY completion_count DESC
    LIMIT 1
  )
  SELECT
    (SELECT COUNT(*) FROM group_members WHERE group_id = p_group_id)::BIGINT,

    COALESCE(
      (SELECT COUNT(DISTINCT c.id)
       FROM completions c
       JOIN challenge_participants cp ON cp.challenge_id = c.challenge_id
       JOIN group_members gm ON gm.user_id = cp.user_id
       WHERE gm.group_id = p_group_id
       AND c.deleted = false
       AND (time_threshold IS NULL OR c.completed_at >= time_threshold)),
      0
    )::BIGINT,

    COALESCE(
      (SELECT COUNT(DISTINCT c.id)
       FROM completions c
       JOIN challenges ch ON ch.id = c.challenge_id
       JOIN group_members gm ON gm.user_id = c.user_id
       WHERE gm.group_id = p_group_id
       AND ch.group_id = p_group_id
       AND c.deleted = false
       AND (time_threshold IS NULL OR c.completed_at >= time_threshold)),
      0
    )::BIGINT,

    COALESCE(
      (SELECT SUM(c.value)
       FROM completions c
       JOIN challenge_participants cp ON cp.challenge_id = c.challenge_id
       JOIN group_members gm ON gm.user_id = cp.user_id
       WHERE gm.group_id = p_group_id
       AND c.deleted = false
       AND (time_threshold IS NULL OR c.completed_at >= time_threshold)),
      0
    ),

    COALESCE(
      (SELECT AVG(completion_count) FROM member_completions),
      0
    ),

    (SELECT user_id FROM most_active),
    (SELECT display_name FROM most_active),
    COALESCE((SELECT completion_count FROM most_active), 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- Indexes for Performance
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_completions_group_lookup
  ON completions(user_id, challenge_id, completed_at)
  WHERE deleted = false;

CREATE INDEX IF NOT EXISTS idx_completions_time_filter
  ON completions(completed_at)
  WHERE deleted = false;

-- ============================================================================
-- Comments
-- ============================================================================
COMMENT ON VIEW group_member_stats IS
  'Aggregated statistics for all group members across all their challenges';

COMMENT ON FUNCTION get_group_leaderboard IS
  'Returns ranked leaderboard for a group with optional time filtering (week, month, all_time)';

COMMENT ON FUNCTION get_group_aggregate_stats IS
  'Returns aggregate statistics for the entire group';

-- ============================================================================
-- Grants (allow authenticated users to read)
-- ============================================================================
GRANT SELECT ON group_member_stats TO authenticated;
