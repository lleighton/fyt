-- Migration: Fix Tag RLS infinite recursion
-- The original policies created circular dependencies between tags and tag_recipients tables

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Tags are viewable by sender and recipients" ON tags;
DROP POLICY IF EXISTS "Tag recipients are viewable by involved parties" ON tag_recipients;
DROP POLICY IF EXISTS "Tag senders can create recipients" ON tag_recipients;

-- TAGS - Simplified policies without circular reference to tag_recipients
-- For SELECT, we check direct ownership or public status, group membership handled separately
CREATE POLICY "Users can view own tags" ON tags FOR SELECT
  USING (deleted = FALSE AND sender_id = auth.uid());

CREATE POLICY "Users can view public tags" ON tags FOR SELECT
  USING (deleted = FALSE AND is_public = TRUE);

CREATE POLICY "Users can view tags in their groups" ON tags FOR SELECT
  USING (
    deleted = FALSE
    AND group_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM group_members
      WHERE group_members.group_id = tags.group_id
      AND group_members.user_id = auth.uid()
    )
  );

-- Users can view tags they were tagged in (uses security definer function to avoid recursion)
CREATE OR REPLACE FUNCTION is_tag_recipient(tag_uuid UUID, user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM tag_recipients
    WHERE tag_id = tag_uuid
    AND recipient_id = user_uuid
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

CREATE POLICY "Users can view tags they received" ON tags FOR SELECT
  USING (deleted = FALSE AND is_tag_recipient(id, auth.uid()));

-- TAG RECIPIENTS - Simplified policies without circular reference to tags
-- Recipients can always see their own recipient records
CREATE POLICY "Users can view own tag_recipient records" ON tag_recipients FOR SELECT
  USING (recipient_id = auth.uid());

-- Use security definer function to check if user is the tag sender
CREATE OR REPLACE FUNCTION is_tag_sender(tag_uuid UUID, user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM tags
    WHERE id = tag_uuid
    AND sender_id = user_uuid
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

CREATE POLICY "Tag senders can view their tag recipients" ON tag_recipients FOR SELECT
  USING (is_tag_sender(tag_id, auth.uid()));

-- For public tags, anyone can see recipients
CREATE OR REPLACE FUNCTION is_tag_public(tag_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM tags
    WHERE id = tag_uuid
    AND is_public = TRUE
    AND deleted = FALSE
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

CREATE POLICY "Anyone can view recipients of public tags" ON tag_recipients FOR SELECT
  USING (is_tag_public(tag_id));

-- INSERT policies for tag_recipients
CREATE POLICY "Tag senders can add recipients" ON tag_recipients FOR INSERT
  WITH CHECK (is_tag_sender(tag_id, auth.uid()));

-- Note: The original UPDATE policy for recipients is still valid
-- "Recipients can update their own record" ON tag_recipients FOR UPDATE USING (recipient_id = auth.uid())
