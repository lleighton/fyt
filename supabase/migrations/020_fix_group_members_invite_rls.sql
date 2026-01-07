-- Fix RLS policy for group_members to allow admins to invite others
-- Current policy only allows users to add themselves (auth.uid() = user_id)
-- We need to also allow group admins to add other users

-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Users can join groups" ON group_members;

-- Create a more permissive policy that allows:
-- 1. Users to add themselves to a group (joining via invite code)
-- 2. Group admins to add other users (inviting)
CREATE POLICY "Users can join or be invited to groups" ON group_members FOR INSERT
WITH CHECK (
  -- User is adding themselves
  auth.uid() = user_id
  OR
  -- User is a group admin adding someone else
  EXISTS (
    SELECT 1 FROM group_members gm
    WHERE gm.group_id = group_members.group_id
      AND gm.user_id = auth.uid()
      AND gm.role = 'admin'
  )
);

-- Also allow admins to remove members (not just users removing themselves)
DROP POLICY IF EXISTS "Users can leave groups" ON group_members;

CREATE POLICY "Users can leave or be removed from groups" ON group_members FOR DELETE
USING (
  -- User is removing themselves
  auth.uid() = user_id
  OR
  -- User is a group admin removing someone else
  EXISTS (
    SELECT 1 FROM group_members gm
    WHERE gm.group_id = group_members.group_id
      AND gm.user_id = auth.uid()
      AND gm.role = 'admin'
  )
);
