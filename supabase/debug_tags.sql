-- Debug SQL for Tag System
-- Run these queries in Supabase SQL Editor to diagnose issues

-- ============================================
-- 1. CHECK IF TABLES EXIST
-- ============================================
SELECT 'exercises' as table_name, COUNT(*) as row_count FROM exercises
UNION ALL
SELECT 'tags', COUNT(*) FROM tags
UNION ALL
SELECT 'tag_recipients', COUNT(*) FROM tag_recipients
UNION ALL
SELECT 'streaks', COUNT(*) FROM streaks;

-- ============================================
-- 2. CHECK EXERCISES ARE SEEDED
-- ============================================
SELECT id, name, category, type, icon FROM exercises ORDER BY display_order LIMIT 10;

-- ============================================
-- 3. CHECK YOUR USER'S PROFILE TAG FIELDS
-- ============================================
SELECT
  id,
  display_name,
  tag_streak_public,
  tag_streak_longest,
  total_tags_sent,
  total_tags_completed
FROM profiles
WHERE id = auth.uid();

-- ============================================
-- 4. CHECK ALL TAGS YOU'VE SENT
-- ============================================
SELECT
  t.id,
  t.sender_id,
  t.value,
  t.is_public,
  t.expires_at,
  t.created_at,
  e.name as exercise_name,
  e.icon as exercise_icon
FROM tags t
JOIN exercises e ON e.id = t.exercise_id
WHERE t.sender_id = auth.uid()
ORDER BY t.created_at DESC;

-- ============================================
-- 5. CHECK TAG RECIPIENTS FOR YOUR TAGS
-- ============================================
SELECT
  tr.id,
  tr.tag_id,
  tr.recipient_id,
  tr.status,
  tr.completed_value,
  tr.created_at,
  p.display_name as recipient_name
FROM tag_recipients tr
JOIN tags t ON t.id = tr.tag_id
LEFT JOIN profiles p ON p.id = tr.recipient_id
WHERE t.sender_id = auth.uid()
ORDER BY tr.created_at DESC;

-- ============================================
-- 6. CHECK YOUR STREAKS
-- ============================================
SELECT
  id,
  user_id,
  streak_type,
  partner_id,
  group_id,
  current_count,
  longest_count,
  last_activity_at,
  streak_started_at
FROM streaks
WHERE user_id = auth.uid();

-- ============================================
-- 7. CHECK RLS POLICIES ON TAGS TABLE
-- ============================================
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'tags';

-- ============================================
-- 8. CHECK RLS POLICIES ON TAG_RECIPIENTS TABLE
-- ============================================
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'tag_recipients';

-- ============================================
-- 9. TEST UPDATE_TAG_STREAK FUNCTION EXISTS
-- ============================================
SELECT
  routine_name,
  routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name LIKE '%tag%streak%';

-- ============================================
-- 10. MANUALLY TEST STREAK UPDATE (replace USER_ID)
-- ============================================
-- Uncomment and replace 'YOUR-USER-ID' with your actual user ID:
-- SELECT update_tag_streak('YOUR-USER-ID'::UUID, 'public', NULL, NULL);

-- ============================================
-- 11. CHECK IF HELPER FUNCTIONS EXIST (from migration 015)
-- ============================================
SELECT
  routine_name,
  routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name IN ('is_tag_recipient', 'is_tag_sender', 'is_tag_public');

-- ============================================
-- 12. QUICK FIX: MANUALLY UPDATE YOUR STREAK
-- ============================================
-- If tags exist but streak is 0, run this (replace YOUR-USER-ID):
-- UPDATE profiles
-- SET tag_streak_public = (SELECT COUNT(*) FROM tags WHERE sender_id = 'YOUR-USER-ID' AND is_public = true AND deleted = false)
-- WHERE id = 'YOUR-USER-ID';
