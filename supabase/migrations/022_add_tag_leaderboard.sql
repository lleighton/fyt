-- Tag-centric leaderboard: Statistics based on tag activity
-- Shows: Tags Sent, Tags Beaten, Win Rate, Tag Streak

-- Function to get tag statistics for a user's network (friends they've interacted with via tags)
CREATE OR REPLACE FUNCTION get_tag_leaderboard(p_user_id UUID)
RETURNS TABLE (
  user_id UUID,
  display_name TEXT,
  first_name TEXT,
  avatar_url TEXT,
  tags_sent BIGINT,
  tags_received BIGINT,
  tags_beaten BIGINT,
  win_rate NUMERIC,
  is_current_user BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH user_network AS (
    -- Get all users in the current user's tag network
    -- (people they've tagged or been tagged by)
    SELECT DISTINCT network_user_id
    FROM (
      -- Users I've sent tags to (via tag_recipients)
      SELECT tr.recipient_id AS network_user_id
      FROM tags t
      JOIN tag_recipients tr ON tr.tag_id = t.id
      WHERE t.sender_id = p_user_id
        AND tr.recipient_id != p_user_id
        AND t.deleted = FALSE

      UNION

      -- Users who have sent tags to me
      SELECT t.sender_id AS network_user_id
      FROM tag_recipients tr
      JOIN tags t ON t.id = tr.tag_id
      WHERE tr.recipient_id = p_user_id
        AND t.sender_id != p_user_id
        AND t.deleted = FALSE

      UNION

      -- Always include the current user
      SELECT p_user_id AS network_user_id
    ) network
  ),
  tag_stats AS (
    SELECT
      p.id AS user_id,
      p.display_name,
      p.first_name,
      p.avatar_url,
      -- Tags sent (where user is the sender)
      (
        SELECT COUNT(*)
        FROM tags t
        WHERE t.sender_id = p.id
          AND t.deleted = FALSE
      ) AS tags_sent,
      -- Tags received (where user is a recipient, excluding self-tags from being sender)
      (
        SELECT COUNT(*)
        FROM tag_recipients tr
        JOIN tags t ON t.id = tr.tag_id
        WHERE tr.recipient_id = p.id
          AND t.sender_id != p.id
          AND t.deleted = FALSE
      ) AS tags_received,
      -- Tags beaten (completed with value > sender's value)
      (
        SELECT COUNT(*)
        FROM tag_recipients tr
        JOIN tags t ON t.id = tr.tag_id
        WHERE tr.recipient_id = p.id
          AND t.sender_id != p.id
          AND tr.status = 'completed'
          AND tr.completed_value > t.value
          AND t.deleted = FALSE
      ) AS tags_beaten
    FROM profiles p
    WHERE p.id IN (SELECT network_user_id FROM user_network)
  )
  SELECT
    ts.user_id,
    ts.display_name,
    ts.first_name,
    ts.avatar_url,
    ts.tags_sent,
    ts.tags_received,
    ts.tags_beaten,
    CASE
      WHEN ts.tags_received > 0
      THEN ROUND((ts.tags_beaten::NUMERIC / ts.tags_received::NUMERIC) * 100, 1)
      ELSE 0
    END AS win_rate,
    (ts.user_id = p_user_id) AS is_current_user
  FROM tag_stats ts
  ORDER BY ts.tags_beaten DESC, ts.tags_sent DESC;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_tag_leaderboard(UUID) TO authenticated;
