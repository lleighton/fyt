-- Add push notification support
-- Stores Expo push tokens for sending notifications

-- Add push_token column to profiles
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS push_token TEXT;

-- Index for faster lookups when sending notifications
CREATE INDEX IF NOT EXISTS idx_profiles_push_token ON profiles(push_token) WHERE push_token IS NOT NULL;

-- Function to get push tokens for tag recipients
-- Used by Edge Function to send notifications
CREATE OR REPLACE FUNCTION get_tag_recipient_push_tokens(p_tag_id UUID)
RETURNS TABLE (
  recipient_id UUID,
  push_token TEXT,
  sender_name TEXT,
  exercise_name TEXT,
  tag_value INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    tr.recipient_id,
    p.push_token,
    COALESCE(sender.display_name, sender.first_name, 'Someone') AS sender_name,
    e.name AS exercise_name,
    t.value AS tag_value
  FROM tag_recipients tr
  JOIN profiles p ON p.id = tr.recipient_id
  JOIN tags t ON t.id = tr.tag_id
  JOIN profiles sender ON sender.id = t.sender_id
  JOIN exercises e ON e.id = t.exercise_id
  WHERE tr.tag_id = p_tag_id
    AND tr.recipient_id != t.sender_id  -- Don't notify the sender
    AND p.push_token IS NOT NULL;
END;
$$;

GRANT EXECUTE ON FUNCTION get_tag_recipient_push_tokens(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_tag_recipient_push_tokens(UUID) TO service_role;
