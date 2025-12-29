-- Add user completion tracking for one-time challenges
-- Allows marking challenges as "done" when user completes them

-- Add completed_by_user field to challenge_participants
-- This tracks if the user considers the challenge complete
ALTER TABLE challenge_participants
ADD COLUMN IF NOT EXISTS completed_by_user BOOLEAN DEFAULT FALSE;

-- Add user_completed_at timestamp
ALTER TABLE challenge_participants
ADD COLUMN IF NOT EXISTS user_completed_at TIMESTAMPTZ;

-- Add comments
COMMENT ON COLUMN challenge_participants.completed_by_user IS 'True when user marks one-time challenge as complete';
COMMENT ON COLUMN challenge_participants.user_completed_at IS 'When user marked the challenge complete';

-- Index for querying user-completed challenges
CREATE INDEX IF NOT EXISTS idx_participants_completed
  ON challenge_participants(user_id, completed_by_user)
  WHERE completed_by_user = TRUE;

-- For one-time challenges: auto-mark as completed when first completion is logged
-- This trigger fires when a completion is inserted
CREATE OR REPLACE FUNCTION auto_complete_one_time_challenge()
RETURNS TRIGGER AS $$
DECLARE
  challenge_freq TEXT;
  participant_id UUID;
BEGIN
  -- Get the challenge frequency
  SELECT frequency INTO challenge_freq
  FROM challenges
  WHERE id = NEW.challenge_id;

  -- If it's a one-time challenge, mark participant as completed
  IF challenge_freq = 'one_time' THEN
    -- Find or update the participant record
    UPDATE challenge_participants
    SET
      completed_by_user = TRUE,
      user_completed_at = NEW.completed_at
    WHERE
      challenge_id = NEW.challenge_id
      AND user_id = NEW.user_id
      AND completed_by_user = FALSE;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_auto_complete_one_time ON completions;
CREATE TRIGGER trigger_auto_complete_one_time
  AFTER INSERT ON completions
  FOR EACH ROW
  EXECUTE FUNCTION auto_complete_one_time_challenge();

-- Grant execute permission
GRANT EXECUTE ON FUNCTION auto_complete_one_time_challenge() TO authenticated;
