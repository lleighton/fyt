-- Migration: Fix type mismatch in get_group_leaderboard function
-- The COALESCE with integer 0 was causing bigint return instead of numeric

DROP FUNCTION IF EXISTS get_group_leaderboard(UUID, TEXT);

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

      -- Total points (filtered by time) - use 0::NUMERIC for proper type
      COALESCE(
        SUM(c.value) FILTER (
          WHERE c.deleted = false
          AND (time_threshold IS NULL OR c.completed_at >= time_threshold)
        ),
        0::NUMERIC
      ) AS total_points,

      -- Group challenge points (filtered by time) - use 0::NUMERIC for proper type
      COALESCE(
        SUM(c.value) FILTER (
          WHERE c.deleted = false
          AND ch.group_id = p_group_id
          AND (time_threshold IS NULL OR c.completed_at >= time_threshold)
        ),
        0::NUMERIC
      ) AS group_challenge_points,

      -- Average performance (filtered by time) - use 0::NUMERIC for proper type
      COALESCE(
        AVG(c.value) FILTER (
          WHERE c.deleted = false
          AND (time_threshold IS NULL OR c.completed_at >= time_threshold)
        ),
        0::NUMERIC
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

-- Add comment
COMMENT ON FUNCTION get_group_leaderboard IS
  'Returns ranked leaderboard for a group with optional time filtering (week, month, all_time). Fixed type casting for NUMERIC columns.';
