-- Comprehensive fix for all remaining RLS recursion issues
-- This migration fixes all circular dependencies and self-references in RLS policies

-- ============================================
-- 1. FIX GROUP_MEMBERS SELF-REFERENCE
-- ============================================

-- Drop the self-referencing policy
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'group_members'
      AND policyname = 'Group members are viewable by group members'
  ) THEN
    EXECUTE 'DROP POLICY "Group members are viewable by group members" ON public.group_members';
  END IF;
END $$;

-- Create a SECURITY DEFINER function to check group membership without triggering RLS
CREATE OR REPLACE FUNCTION is_group_member(group_id UUID, user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM group_members
    WHERE group_members.group_id = is_group_member.group_id
    AND group_members.user_id = is_group_member.user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Create new policy using the function
CREATE POLICY "Group members are viewable by group members" ON group_members
  FOR SELECT
  TO authenticated
  USING (is_group_member(group_id, auth.uid()));

-- ============================================
-- 2. FIX GROUPS POLICY (references group_members)
-- ============================================

-- Drop existing policies
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'groups'
      AND policyname = 'Groups are viewable'
  ) THEN
    EXECUTE 'DROP POLICY "Groups are viewable" ON public.groups';
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'groups'
      AND policyname = 'Admins can update groups'
  ) THEN
    EXECUTE 'DROP POLICY "Admins can update groups" ON public.groups';
  END IF;
END $$;

-- Recreate using the SECURITY DEFINER function
CREATE POLICY "Groups are viewable" ON groups
  FOR SELECT
  TO authenticated
  USING (
    deleted = FALSE AND (
      is_private = FALSE
      OR creator_id = auth.uid()
      OR is_group_member(id, auth.uid())
    )
  );

-- Function to check if user is group admin
CREATE OR REPLACE FUNCTION is_group_admin(group_id UUID, user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM group_members
    WHERE group_members.group_id = is_group_admin.group_id
    AND group_members.user_id = is_group_admin.user_id
    AND group_members.role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

CREATE POLICY "Admins can update groups" ON groups
  FOR UPDATE
  TO authenticated
  USING (is_group_admin(id, auth.uid()));

-- ============================================
-- 3. FIX COMPLETIONS POLICY (references challenge_participants)
-- ============================================

-- Drop existing completions viewable policy
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'completions'
      AND policyname = 'Completions are viewable'
  ) THEN
    EXECUTE 'DROP POLICY "Completions are viewable" ON public.completions';
  END IF;
END $$;

-- Recreate using the is_challenge_participant function (created in migration 004)
CREATE POLICY "Completions are viewable" ON completions
  FOR SELECT
  TO authenticated
  USING (
    deleted = FALSE AND (
      user_id = auth.uid()
      OR is_challenge_participant(challenge_id, auth.uid())
      OR EXISTS (
        SELECT 1 FROM challenges
        WHERE id = completions.challenge_id
        AND is_public = TRUE
      )
    )
  );

-- ============================================
-- 4. ADD HELPER FUNCTIONS FOR COMMON CHECKS
-- ============================================

-- Function to check if a challenge is public
CREATE OR REPLACE FUNCTION is_public_challenge(challenge_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM challenges
    WHERE id = is_public_challenge.challenge_id
    AND is_public = TRUE
    AND deleted = FALSE
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Function to check if user created a challenge
CREATE OR REPLACE FUNCTION is_challenge_creator(challenge_id UUID, user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM challenges
    WHERE id = is_challenge_creator.challenge_id
    AND creator_id = is_challenge_creator.user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ============================================
-- 5. GRANT EXECUTE PERMISSIONS ON FUNCTIONS
-- ============================================

GRANT EXECUTE ON FUNCTION is_group_member(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION is_group_admin(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION is_challenge_participant(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION is_public_challenge(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION is_challenge_creator(UUID, UUID) TO authenticated;
