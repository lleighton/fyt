-- Fix infinite recursion in challenge_participants RLS policy
-- The original policy referenced challenge_participants within itself, causing infinite loops

-- Drop the problematic policy if it exists (idempotent)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'challenge_participants'
      AND policyname = 'Participants are viewable'
  ) THEN
    EXECUTE 'DROP POLICY "Participants are viewable" ON public.challenge_participants';
  END IF;
END $$;

-- Create a simpler policy that doesn't reference itself
-- Allow viewing if:
-- 1. You are the participant (direct check, no subquery on same table)
-- 2. OR you created the challenge
-- 3. OR the challenge is public
CREATE POLICY "Participants are viewable" ON challenge_participants
  FOR SELECT
  TO authenticated
  USING (
    -- You are this participant
    user_id = auth.uid()
    -- OR you created the challenge
    OR EXISTS (
      SELECT 1 FROM challenges c
      WHERE c.id = challenge_participants.challenge_id
      AND c.creator_id = auth.uid()
    )
    -- OR the challenge is public
    OR EXISTS (
      SELECT 1 FROM challenges c
      WHERE c.id = challenge_participants.challenge_id
      AND c.is_public = TRUE
    )
  );
