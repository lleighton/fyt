-- ============================================
-- FIX: Allow re-inviting users who left a group
-- ============================================
-- The unique constraint on (group_id, invitee_id) prevents re-inviting
-- users who previously accepted/declined an invite. This migration adds
-- an RPC function to handle re-invites by resetting existing records.

-- Allow admins to update/delete invites in their groups
DO $$ BEGIN
  CREATE POLICY "Admins can update group invitations" ON group_invites
    FOR UPDATE USING (
      EXISTS (
        SELECT 1 FROM group_members
        WHERE group_id = group_invites.group_id
        AND user_id = auth.uid()
        AND role = 'admin'
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Admins can delete group invitations" ON group_invites
    FOR DELETE USING (
      EXISTS (
        SELECT 1 FROM group_members
        WHERE group_id = group_invites.group_id
        AND user_id = auth.uid()
        AND role = 'admin'
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- RPC function to create or reset group invitations
-- Handles both new invites and re-invites (users who left)
CREATE OR REPLACE FUNCTION upsert_group_invite(
  p_group_id UUID,
  p_invitee_id UUID
)
RETURNS UUID AS $$
DECLARE
  v_invite_id UUID;
  v_is_admin BOOLEAN;
  v_is_member BOOLEAN;
BEGIN
  -- Check if caller is admin of the group
  SELECT EXISTS (
    SELECT 1 FROM group_members
    WHERE group_id = p_group_id
    AND user_id = auth.uid()
    AND role = 'admin'
  ) INTO v_is_admin;

  IF NOT v_is_admin THEN
    RAISE EXCEPTION 'Only group admins can send invitations';
  END IF;

  -- Check if invitee is already a member
  SELECT EXISTS (
    SELECT 1 FROM group_members
    WHERE group_id = p_group_id
    AND user_id = p_invitee_id
  ) INTO v_is_member;

  IF v_is_member THEN
    RAISE EXCEPTION 'User is already a member of this group';
  END IF;

  -- Upsert: insert or update existing invite
  INSERT INTO group_invites (group_id, inviter_id, invitee_id, status, created_at, updated_at, responded_at)
  VALUES (p_group_id, auth.uid(), p_invitee_id, 'pending', NOW(), NOW(), NULL)
  ON CONFLICT (group_id, invitee_id)
  DO UPDATE SET
    inviter_id = auth.uid(),
    status = 'pending',
    created_at = NOW(),
    updated_at = NOW(),
    responded_at = NULL
  RETURNING id INTO v_invite_id;

  RETURN v_invite_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Batch invite function for efficiency
CREATE OR REPLACE FUNCTION batch_upsert_group_invites(
  p_group_id UUID,
  p_invitee_ids UUID[]
)
RETURNS UUID[] AS $$
DECLARE
  v_invite_ids UUID[] := '{}';
  v_invitee_id UUID;
  v_invite_id UUID;
BEGIN
  FOREACH v_invitee_id IN ARRAY p_invitee_ids
  LOOP
    v_invite_id := upsert_group_invite(p_group_id, v_invitee_id);
    v_invite_ids := array_append(v_invite_ids, v_invite_id);
  END LOOP;

  RETURN v_invite_ids;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
