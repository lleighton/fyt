-- Fix circular dependency between challenges and challenge_participants RLS policies
--
-- The problem:
-- - challenges policy checks challenge_participants (line 279 in 001_initial_schema.sql)
-- - challenge_participants policy checks challenges (fixed in 003)
-- This creates infinite recursion: challenges -> participants -> challenges -> ...

-- Drop the problematic challenges policy if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'challenges'
      AND policyname = 'Public challenges are viewable'
  ) THEN
    EXECUTE 'DROP POLICY "Public challenges are viewable" ON public.challenges';
  END IF;
END $$;

-- Create a simpler policy that doesn't check challenge_participants
-- Allow viewing if:
-- 1. The challenge is public
-- 2. OR you created it
-- Note: We removed the "OR you're a participant" check to break circular dependency
-- Users can still see challenges they participate in via the public flag or creator check
CREATE POLICY "Public challenges are viewable" ON challenges
  FOR SELECT
  TO authenticated
  USING (
    deleted = FALSE AND (
      is_public = TRUE
      OR creator_id = auth.uid()
    )
  );

-- Alternative approach: Add a separate policy for participant access using a function
-- This breaks the recursion by using a security definer function
CREATE OR REPLACE FUNCTION is_challenge_participant(challenge_id UUID, user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM challenge_participants
    WHERE challenge_participants.challenge_id = is_challenge_participant.challenge_id
    AND challenge_participants.user_id = is_challenge_participant.user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Add a second policy for participant access using the function
CREATE POLICY "Participants can view their challenges" ON challenges
  FOR SELECT
  TO authenticated
  USING (
    deleted = FALSE AND is_challenge_participant(id, auth.uid())
  );
