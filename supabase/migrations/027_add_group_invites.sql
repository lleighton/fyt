-- ============================================
-- GROUP INVITES TABLE
-- ============================================
-- Tracks pending group invitations that require user acceptance

CREATE TABLE IF NOT EXISTS group_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  inviter_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  invitee_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  responded_at TIMESTAMPTZ,
  UNIQUE(group_id, invitee_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_group_invites_invitee ON group_invites(invitee_id) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_group_invites_group ON group_invites(group_id);
CREATE INDEX IF NOT EXISTS idx_group_invites_status ON group_invites(status, created_at DESC);

-- Updated at trigger
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_updated_at_group_invites') THEN
    CREATE TRIGGER set_updated_at_group_invites
      BEFORE UPDATE ON group_invites
      FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
  END IF;
END $$;

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE group_invites ENABLE ROW LEVEL SECURITY;

-- Invitees can view their own invitations
DO $$ BEGIN
  CREATE POLICY "Invitees can view own invitations" ON group_invites
    FOR SELECT USING (invitee_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Inviters can view invitations they created
DO $$ BEGIN
  CREATE POLICY "Inviters can view own invitations" ON group_invites
    FOR SELECT USING (inviter_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Group admins can create invitations
DO $$ BEGIN
  CREATE POLICY "Admins can create group invitations" ON group_invites
    FOR INSERT WITH CHECK (
      EXISTS (
        SELECT 1 FROM group_members
        WHERE group_id = group_invites.group_id
        AND user_id = auth.uid()
        AND role = 'admin'
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Invitees can update their own invitations (accept/decline)
DO $$ BEGIN
  CREATE POLICY "Invitees can respond to invitations" ON group_invites
    FOR UPDATE USING (invitee_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============================================
-- RPC FUNCTIONS
-- ============================================

-- Accept a group invitation
CREATE OR REPLACE FUNCTION accept_group_invite(p_invite_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_invite RECORD;
  v_already_member BOOLEAN;
BEGIN
  -- Get the invitation
  SELECT * INTO v_invite
  FROM group_invites
  WHERE id = p_invite_id
    AND invitee_id = auth.uid()
    AND status = 'pending';

  IF v_invite IS NULL THEN
    RAISE EXCEPTION 'Invitation not found or already responded';
  END IF;

  -- Check if already a member
  SELECT EXISTS (
    SELECT 1 FROM group_members
    WHERE group_id = v_invite.group_id
    AND user_id = auth.uid()
  ) INTO v_already_member;

  IF v_already_member THEN
    -- Already a member, just mark invite as accepted
    UPDATE group_invites
    SET status = 'accepted', responded_at = NOW(), updated_at = NOW()
    WHERE id = p_invite_id;
    RETURN TRUE;
  END IF;

  -- Add user to group
  INSERT INTO group_members (group_id, user_id, role, joined_at)
  VALUES (v_invite.group_id, auth.uid(), 'member', NOW())
  ON CONFLICT (group_id, user_id) DO NOTHING;

  -- Update invitation status
  UPDATE group_invites
  SET status = 'accepted', responded_at = NOW(), updated_at = NOW()
  WHERE id = p_invite_id;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Decline a group invitation
CREATE OR REPLACE FUNCTION decline_group_invite(p_invite_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_invite RECORD;
BEGIN
  -- Get the invitation
  SELECT * INTO v_invite
  FROM group_invites
  WHERE id = p_invite_id
    AND invitee_id = auth.uid()
    AND status = 'pending';

  IF v_invite IS NULL THEN
    RAISE EXCEPTION 'Invitation not found or already responded';
  END IF;

  -- Update invitation status
  UPDATE group_invites
  SET status = 'declined', responded_at = NOW(), updated_at = NOW()
  WHERE id = p_invite_id;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get pending invitations for current user
CREATE OR REPLACE FUNCTION get_pending_group_invites()
RETURNS TABLE (
  invite_id UUID,
  group_id UUID,
  group_name TEXT,
  group_avatar_url TEXT,
  inviter_id UUID,
  inviter_name TEXT,
  inviter_avatar_url TEXT,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    gi.id AS invite_id,
    gi.group_id,
    g.name AS group_name,
    g.avatar_url AS group_avatar_url,
    gi.inviter_id,
    p.display_name AS inviter_name,
    p.avatar_url AS inviter_avatar_url,
    gi.created_at
  FROM group_invites gi
  JOIN groups g ON g.id = gi.group_id
  JOIN profiles p ON p.id = gi.inviter_id
  WHERE gi.invitee_id = auth.uid()
    AND gi.status = 'pending'
    AND g.deleted = FALSE
  ORDER BY gi.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to get push token for group invite notification
CREATE OR REPLACE FUNCTION get_group_invite_push_token(p_invite_id UUID)
RETURNS TABLE (
  push_token TEXT,
  invitee_name TEXT,
  group_name TEXT,
  inviter_name TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    invitee.push_token,
    invitee.display_name AS invitee_name,
    g.name AS group_name,
    inviter.display_name AS inviter_name
  FROM group_invites gi
  JOIN profiles invitee ON invitee.id = gi.invitee_id
  JOIN profiles inviter ON inviter.id = gi.inviter_id
  JOIN groups g ON g.id = gi.group_id
  WHERE gi.id = p_invite_id
    AND invitee.push_token IS NOT NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable realtime for group_invites
ALTER PUBLICATION supabase_realtime ADD TABLE group_invites;
