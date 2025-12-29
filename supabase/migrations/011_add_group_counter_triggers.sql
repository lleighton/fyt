-- Migration: Add automatic counter updates for groups and challenges
-- This ensures member_count and participant_count stay in sync

-- ============================================================================
-- Function: Update group member count
-- ============================================================================
CREATE OR REPLACE FUNCTION update_group_member_count()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the member count for the affected group
  UPDATE groups
  SET member_count = (
    SELECT COUNT(*)
    FROM group_members
    WHERE group_id = COALESCE(NEW.group_id, OLD.group_id)
  )
  WHERE id = COALESCE(NEW.group_id, OLD.group_id);

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- Trigger: Auto-update group member_count on INSERT/DELETE
-- ============================================================================
DROP TRIGGER IF EXISTS group_members_count_trigger ON group_members;
CREATE TRIGGER group_members_count_trigger
  AFTER INSERT OR DELETE ON group_members
  FOR EACH ROW
  EXECUTE FUNCTION update_group_member_count();

-- ============================================================================
-- Function: Update challenge participant count
-- ============================================================================
CREATE OR REPLACE FUNCTION update_challenge_participant_count()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the participant count for the affected challenge
  UPDATE challenges
  SET participant_count = (
    SELECT COUNT(*)
    FROM challenge_participants
    WHERE challenge_id = COALESCE(NEW.challenge_id, OLD.challenge_id)
  )
  WHERE id = COALESCE(NEW.challenge_id, OLD.challenge_id);

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- Trigger: Auto-update challenge participant_count on INSERT/DELETE
-- ============================================================================
DROP TRIGGER IF EXISTS challenge_participants_count_trigger ON challenge_participants;
CREATE TRIGGER challenge_participants_count_trigger
  AFTER INSERT OR DELETE ON challenge_participants
  FOR EACH ROW
  EXECUTE FUNCTION update_challenge_participant_count();

-- ============================================================================
-- Backfill: Update all existing counts to correct values
-- ============================================================================

-- Fix all group member counts
UPDATE groups g
SET member_count = (
  SELECT COUNT(*)
  FROM group_members gm
  WHERE gm.group_id = g.id
);

-- Fix all challenge participant counts
UPDATE challenges c
SET participant_count = (
  SELECT COUNT(*)
  FROM challenge_participants cp
  WHERE cp.challenge_id = c.id
);

-- ============================================================================
-- Indexes: Improve query performance for group-filtered challenges
-- ============================================================================

-- Index for filtering challenges by group_id
CREATE INDEX IF NOT EXISTS idx_challenges_group_id
  ON challenges(group_id)
  WHERE group_id IS NOT NULL;

-- Index for filtering global challenges (no group)
CREATE INDEX IF NOT EXISTS idx_challenges_global
  ON challenges(id)
  WHERE group_id IS NULL;

-- Index for group member lookups
CREATE INDEX IF NOT EXISTS idx_group_members_user_id
  ON group_members(user_id);

-- Composite index for checking group membership
CREATE INDEX IF NOT EXISTS idx_group_members_group_user
  ON group_members(group_id, user_id);

-- ============================================================================
-- Comments
-- ============================================================================
COMMENT ON FUNCTION update_group_member_count() IS
  'Automatically updates groups.member_count when members are added or removed';

COMMENT ON FUNCTION update_challenge_participant_count() IS
  'Automatically updates challenges.participant_count when participants are added or removed';

COMMENT ON INDEX idx_challenges_group_id IS
  'Improves performance when filtering challenges by group';

COMMENT ON INDEX idx_group_members_group_user IS
  'Improves performance when checking if a user is a member of a group';
