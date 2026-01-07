-- ============================================
-- ACCOUNT DELETION MIGRATION
-- ============================================
-- Required for App Store compliance (iOS and Google Play)
-- Users must be able to delete their account and all associated data
--
-- This function:
-- 1. Soft-deletes user content (sets deleted = true)
-- 2. Anonymizes profile data
-- 3. Removes user from groups
-- 4. Declines pending invites
-- 5. Marks auth user for deletion (handled separately)

-- ============================================
-- DELETE ACCOUNT RPC FUNCTION
-- ============================================
CREATE OR REPLACE FUNCTION public.delete_user_account()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_deleted_counts jsonb;
BEGIN
  -- Verify user is authenticated
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- ============================================
  -- 1. SOFT DELETE USER CONTENT
  -- ============================================

  -- Soft delete tags sent by user
  UPDATE tags
  SET deleted = true, updated_at = NOW()
  WHERE sender_id = v_user_id AND deleted = false;

  -- Soft delete completions
  UPDATE completions
  SET deleted = true, updated_at = NOW()
  WHERE user_id = v_user_id AND deleted = false;

  -- Soft delete challenges created by user
  UPDATE challenges
  SET deleted = true, updated_at = NOW()
  WHERE creator_id = v_user_id AND deleted = false;

  -- ============================================
  -- 2. REMOVE FROM GROUPS
  -- ============================================

  -- Remove from all groups (triggers will update member counts)
  DELETE FROM group_members WHERE user_id = v_user_id;

  -- Decline pending group invites
  UPDATE group_invites
  SET status = 'declined', updated_at = NOW()
  WHERE invitee_id = v_user_id AND status = 'pending';

  -- Cancel group invites sent by user
  UPDATE group_invites
  SET status = 'declined', updated_at = NOW()
  WHERE inviter_id = v_user_id AND status = 'pending';

  -- ============================================
  -- 3. HANDLE TAG RECIPIENTS
  -- ============================================

  -- Mark user's pending tag responses as declined
  UPDATE tag_recipients
  SET status = 'declined', updated_at = NOW()
  WHERE recipient_id = v_user_id AND status = 'pending';

  -- ============================================
  -- 4. CLEAR STREAKS
  -- ============================================

  DELETE FROM streaks WHERE user_id = v_user_id;

  -- ============================================
  -- 5. REMOVE CHALLENGE PARTICIPATION
  -- ============================================

  DELETE FROM challenge_participants WHERE user_id = v_user_id;

  -- ============================================
  -- 6. ANONYMIZE PROFILE
  -- ============================================

  UPDATE profiles
  SET
    display_name = 'Deleted User',
    first_name = NULL,
    last_name = NULL,
    username = NULL,
    email = NULL,
    phone_number = NULL,
    avatar_url = NULL,
    push_token = NULL,
    deleted = true,
    updated_at = NOW()
  WHERE id = v_user_id;

  -- Return summary
  RETURN jsonb_build_object(
    'success', true,
    'user_id', v_user_id,
    'message', 'Account data deleted. Sign out to complete deletion.'
  );
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.delete_user_account() TO authenticated;

-- Add comment
COMMENT ON FUNCTION public.delete_user_account() IS
  'Deletes user account data for App Store compliance. Soft-deletes content, anonymizes profile, removes from groups.';
