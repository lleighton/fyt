-- Debug query to check tags data
-- Run this in Supabase SQL Editor

-- 1. Check all tags
SELECT
  t.id,
  t.sender_id,
  t.value,
  t.is_public,
  t.expires_at,
  t.created_at,
  t.deleted,
  e.name as exercise_name,
  p.display_name as sender_name,
  p.username as sender_username
FROM tags t
LEFT JOIN exercises e ON e.id = t.exercise_id
LEFT JOIN profiles p ON p.id = t.sender_id
ORDER BY t.created_at DESC
LIMIT 20;

-- 2. Check all tag_recipients
SELECT
  tr.id,
  tr.tag_id,
  tr.recipient_id,
  tr.status,
  tr.completed_value,
  tr.created_at,
  p.display_name as recipient_name,
  p.username as recipient_username
FROM tag_recipients tr
LEFT JOIN profiles p ON p.id = tr.recipient_id
ORDER BY tr.created_at DESC
LIMIT 20;

-- 3. Check your specific user (replace with your user id if known)
-- This shows tags where you are the sender
SELECT 'Tags sent by current users:' as info;
SELECT
  t.id,
  t.sender_id,
  t.value,
  e.name as exercise,
  t.deleted,
  t.created_at
FROM tags t
LEFT JOIN exercises e ON e.id = t.exercise_id
WHERE t.deleted = FALSE
ORDER BY t.created_at DESC;

-- 4. Count summary
SELECT
  (SELECT COUNT(*) FROM tags WHERE deleted = FALSE) as total_tags,
  (SELECT COUNT(*) FROM tag_recipients) as total_recipients,
  (SELECT COUNT(*) FROM tag_recipients WHERE status = 'pending') as pending_recipients,
  (SELECT COUNT(*) FROM tag_recipients WHERE status = 'completed') as completed_recipients;
