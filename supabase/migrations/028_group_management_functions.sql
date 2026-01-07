-- ============================================
-- GROUP MANAGEMENT RPC FUNCTIONS
-- ============================================
-- Functions for leaving, deleting, and managing groups

-- ============================================
-- LEAVE GROUP
-- ============================================
-- Allows a member to leave a group
-- Blocks if user is the last admin (must transfer ownership or delete)

CREATE OR REPLACE FUNCTION leave_group(p_group_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_is_admin BOOLEAN;
  v_admin_count INT;
  v_member_count INT;
BEGIN
  -- Check if user is a member and get their role
  SELECT role = 'admin' INTO v_is_admin
  FROM group_members
  WHERE group_id = p_group_id AND user_id = auth.uid();

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'You are not a member of this group');
  END IF;

  -- If admin, check if last admin
  IF v_is_admin THEN
    SELECT COUNT(*) INTO v_admin_count
    FROM group_members
    WHERE group_id = p_group_id AND role = 'admin';

    -- Get total member count
    SELECT COUNT(*) INTO v_member_count
    FROM group_members
    WHERE group_id = p_group_id;

    IF v_admin_count <= 1 AND v_member_count > 1 THEN
      RETURN jsonb_build_object(
        'success', false,
        'error', 'You are the last admin. Promote another member to admin before leaving, or delete the group.'
      );
    END IF;
  END IF;

  -- Remove member
  DELETE FROM group_members
  WHERE group_id = p_group_id AND user_id = auth.uid();

  RETURN jsonb_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- DELETE GROUP
-- ============================================
-- Soft deletes a group (admin only)
-- Also declines all pending invitations

CREATE OR REPLACE FUNCTION delete_group(p_group_id UUID)
RETURNS JSONB AS $$
BEGIN
  -- Verify admin
  IF NOT is_group_admin(p_group_id, auth.uid()) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Only admins can delete groups');
  END IF;

  -- Soft delete group
  UPDATE groups
  SET deleted = true, updated_at = NOW()
  WHERE id = p_group_id;

  -- Decline all pending invites
  UPDATE group_invites
  SET status = 'declined', responded_at = NOW(), updated_at = NOW()
  WHERE group_id = p_group_id AND status = 'pending';

  RETURN jsonb_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- REMOVE GROUP MEMBER
-- ============================================
-- Admin removes a member from the group

CREATE OR REPLACE FUNCTION remove_group_member(p_group_id UUID, p_user_id UUID)
RETURNS JSONB AS $$
BEGIN
  -- Verify caller is admin
  IF NOT is_group_admin(p_group_id, auth.uid()) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Only admins can remove members');
  END IF;

  -- Cannot remove self via this function
  IF p_user_id = auth.uid() THEN
    RETURN jsonb_build_object('success', false, 'error', 'Use leave_group to remove yourself');
  END IF;

  -- Check if target is a member
  IF NOT EXISTS (SELECT 1 FROM group_members WHERE group_id = p_group_id AND user_id = p_user_id) THEN
    RETURN jsonb_build_object('success', false, 'error', 'User is not a member of this group');
  END IF;

  -- Remove member
  DELETE FROM group_members
  WHERE group_id = p_group_id AND user_id = p_user_id;

  RETURN jsonb_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- CHANGE MEMBER ROLE
-- ============================================
-- Admin can promote member to admin or demote admin to member
-- Cannot demote if it would leave the group without admins

CREATE OR REPLACE FUNCTION change_member_role(p_group_id UUID, p_user_id UUID, p_new_role TEXT)
RETURNS JSONB AS $$
DECLARE
  v_admin_count INT;
  v_current_role TEXT;
BEGIN
  -- Verify caller is admin
  IF NOT is_group_admin(p_group_id, auth.uid()) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Only admins can change roles');
  END IF;

  -- Validate role value
  IF p_new_role NOT IN ('admin', 'member') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid role. Must be admin or member');
  END IF;

  -- Get current role
  SELECT role INTO v_current_role
  FROM group_members
  WHERE group_id = p_group_id AND user_id = p_user_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'User is not a member of this group');
  END IF;

  -- No change needed
  IF v_current_role = p_new_role THEN
    RETURN jsonb_build_object('success', true, 'message', 'Role unchanged');
  END IF;

  -- If demoting an admin, check not last admin
  IF v_current_role = 'admin' AND p_new_role = 'member' THEN
    SELECT COUNT(*) INTO v_admin_count
    FROM group_members
    WHERE group_id = p_group_id AND role = 'admin';

    IF v_admin_count <= 1 THEN
      RETURN jsonb_build_object('success', false, 'error', 'Cannot demote the last admin. Promote another member first.');
    END IF;
  END IF;

  -- Update role
  UPDATE group_members
  SET role = p_new_role, updated_at = NOW()
  WHERE group_id = p_group_id AND user_id = p_user_id;

  RETURN jsonb_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- REGENERATE INVITE CODE
-- ============================================
-- Admin generates a new invite code for the group
-- Old code immediately becomes invalid

CREATE OR REPLACE FUNCTION regenerate_invite_code(p_group_id UUID)
RETURNS TEXT AS $$
DECLARE
  v_new_code TEXT;
BEGIN
  -- Verify admin
  IF NOT is_group_admin(p_group_id, auth.uid()) THEN
    RAISE EXCEPTION 'Only admins can regenerate invite codes';
  END IF;

  -- Generate new 6-char alphanumeric code
  v_new_code := upper(substr(md5(random()::text || clock_timestamp()::text), 1, 6));

  -- Update group with new code
  UPDATE groups
  SET invite_code = v_new_code, updated_at = NOW()
  WHERE id = p_group_id;

  RETURN v_new_code;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- GET GROUP PENDING INVITES
-- ============================================
-- Admin view of all pending invitations for a group

CREATE OR REPLACE FUNCTION get_group_pending_invites(p_group_id UUID)
RETURNS TABLE (
  invite_id UUID,
  invitee_id UUID,
  invitee_name TEXT,
  invitee_username TEXT,
  invitee_avatar_url TEXT,
  inviter_id UUID,
  inviter_name TEXT,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  -- Verify admin
  IF NOT is_group_admin(p_group_id, auth.uid()) THEN
    RAISE EXCEPTION 'Only admins can view pending invites';
  END IF;

  RETURN QUERY
  SELECT
    gi.id AS invite_id,
    gi.invitee_id,
    invitee.display_name AS invitee_name,
    invitee.username AS invitee_username,
    invitee.avatar_url AS invitee_avatar_url,
    gi.inviter_id,
    inviter.display_name AS inviter_name,
    gi.created_at
  FROM group_invites gi
  JOIN profiles invitee ON invitee.id = gi.invitee_id
  JOIN profiles inviter ON inviter.id = gi.inviter_id
  WHERE gi.group_id = p_group_id AND gi.status = 'pending'
  ORDER BY gi.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- CANCEL GROUP INVITE
-- ============================================
-- Admin cancels a pending invitation

CREATE OR REPLACE FUNCTION cancel_group_invite(p_invite_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_group_id UUID;
BEGIN
  -- Get group_id from invite
  SELECT group_id INTO v_group_id
  FROM group_invites
  WHERE id = p_invite_id AND status = 'pending';

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invitation not found or already processed');
  END IF;

  -- Verify admin
  IF NOT is_group_admin(v_group_id, auth.uid()) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Only admins can cancel invites');
  END IF;

  -- Delete the invite
  DELETE FROM group_invites WHERE id = p_invite_id;

  RETURN jsonb_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- UPDATE GROUP INFO
-- ============================================
-- Admin updates group name, description, or privacy

CREATE OR REPLACE FUNCTION update_group_info(
  p_group_id UUID,
  p_name TEXT DEFAULT NULL,
  p_description TEXT DEFAULT NULL,
  p_is_private BOOLEAN DEFAULT NULL
)
RETURNS JSONB AS $$
BEGIN
  -- Verify admin
  IF NOT is_group_admin(p_group_id, auth.uid()) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Only admins can update group info');
  END IF;

  -- Validate name if provided
  IF p_name IS NOT NULL AND length(trim(p_name)) < 1 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Group name cannot be empty');
  END IF;

  -- Update only provided fields
  UPDATE groups
  SET
    name = COALESCE(p_name, name),
    description = COALESCE(p_description, description),
    is_private = COALESCE(p_is_private, is_private),
    updated_at = NOW()
  WHERE id = p_group_id;

  RETURN jsonb_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
