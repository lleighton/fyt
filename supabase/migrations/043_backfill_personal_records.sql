-- Migration: Backfill personal records from existing tag completions
-- Simplified approach: Use CTEs for clarity and correctness

-- PART 1: Backfill from SENT tags (sender completions)
WITH sender_stats AS (
  SELECT
    sender_id as user_id,
    exercise_id,
    MAX(value) as best_value,
    COUNT(*) as total_completions,
    MAX(created_at) as last_date
  FROM tags
  WHERE sender_id IS NOT NULL
    AND exercise_id IS NOT NULL
    AND value IS NOT NULL
  GROUP BY sender_id, exercise_id
),
sender_best_dates AS (
  SELECT DISTINCT ON (t.sender_id, t.exercise_id)
    t.sender_id as user_id,
    t.exercise_id,
    t.created_at as best_date,
    t.value as best_value
  FROM tags t
  JOIN sender_stats ss ON ss.user_id = t.sender_id
    AND ss.exercise_id = t.exercise_id
    AND ss.best_value = t.value
  ORDER BY t.sender_id, t.exercise_id, t.created_at DESC
),
sender_last_values AS (
  SELECT DISTINCT ON (sender_id, exercise_id)
    sender_id as user_id,
    exercise_id,
    value as last_value
  FROM tags
  WHERE sender_id IS NOT NULL AND exercise_id IS NOT NULL
  ORDER BY sender_id, exercise_id, created_at DESC
)
INSERT INTO personal_records (user_id, exercise_id, best_value, best_date, total_completions, last_value, last_date)
SELECT
  ss.user_id,
  ss.exercise_id,
  ss.best_value,
  sbd.best_date,
  ss.total_completions,
  slv.last_value,
  ss.last_date
FROM sender_stats ss
JOIN sender_best_dates sbd ON sbd.user_id = ss.user_id AND sbd.exercise_id = ss.exercise_id
JOIN sender_last_values slv ON slv.user_id = ss.user_id AND slv.exercise_id = ss.exercise_id
ON CONFLICT (user_id, exercise_id) DO UPDATE SET
  best_value = GREATEST(personal_records.best_value, EXCLUDED.best_value),
  best_date = CASE WHEN EXCLUDED.best_value > personal_records.best_value THEN EXCLUDED.best_date ELSE personal_records.best_date END,
  total_completions = personal_records.total_completions + EXCLUDED.total_completions,
  last_value = EXCLUDED.last_value,
  last_date = GREATEST(personal_records.last_date, EXCLUDED.last_date),
  updated_at = NOW();

-- PART 2: Backfill from RECEIVED tags (recipient completions)
WITH recipient_stats AS (
  SELECT
    tr.recipient_id as user_id,
    COALESCE(tr.completed_exercise_id, t.exercise_id) as exercise_id,
    MAX(tr.completed_value) as best_value,
    COUNT(*) as total_completions,
    MAX(tr.completed_at) as last_date
  FROM tag_recipients tr
  JOIN tags t ON t.id = tr.tag_id
  WHERE tr.status = 'completed'
    AND tr.completed_value IS NOT NULL
    AND tr.recipient_id IS NOT NULL
  GROUP BY tr.recipient_id, COALESCE(tr.completed_exercise_id, t.exercise_id)
),
recipient_best_dates AS (
  SELECT DISTINCT ON (tr.recipient_id, COALESCE(tr.completed_exercise_id, t.exercise_id))
    tr.recipient_id as user_id,
    COALESCE(tr.completed_exercise_id, t.exercise_id) as exercise_id,
    tr.completed_at as best_date
  FROM tag_recipients tr
  JOIN tags t ON t.id = tr.tag_id
  JOIN recipient_stats rs ON rs.user_id = tr.recipient_id
    AND rs.exercise_id = COALESCE(tr.completed_exercise_id, t.exercise_id)
    AND rs.best_value = tr.completed_value
  WHERE tr.status = 'completed'
  ORDER BY tr.recipient_id, COALESCE(tr.completed_exercise_id, t.exercise_id), tr.completed_at DESC
),
recipient_last_values AS (
  SELECT DISTINCT ON (tr.recipient_id, COALESCE(tr.completed_exercise_id, t.exercise_id))
    tr.recipient_id as user_id,
    COALESCE(tr.completed_exercise_id, t.exercise_id) as exercise_id,
    tr.completed_value as last_value
  FROM tag_recipients tr
  JOIN tags t ON t.id = tr.tag_id
  WHERE tr.status = 'completed' AND tr.completed_value IS NOT NULL
  ORDER BY tr.recipient_id, COALESCE(tr.completed_exercise_id, t.exercise_id), tr.completed_at DESC
)
INSERT INTO personal_records (user_id, exercise_id, best_value, best_date, total_completions, last_value, last_date)
SELECT
  rs.user_id,
  rs.exercise_id,
  rs.best_value,
  rbd.best_date,
  rs.total_completions,
  rlv.last_value,
  rs.last_date
FROM recipient_stats rs
JOIN recipient_best_dates rbd ON rbd.user_id = rs.user_id AND rbd.exercise_id = rs.exercise_id
JOIN recipient_last_values rlv ON rlv.user_id = rs.user_id AND rlv.exercise_id = rs.exercise_id
ON CONFLICT (user_id, exercise_id) DO UPDATE SET
  best_value = GREATEST(personal_records.best_value, EXCLUDED.best_value),
  best_date = CASE WHEN EXCLUDED.best_value > personal_records.best_value THEN EXCLUDED.best_date ELSE personal_records.best_date END,
  total_completions = personal_records.total_completions + EXCLUDED.total_completions,
  last_value = EXCLUDED.last_value,
  last_date = GREATEST(personal_records.last_date, EXCLUDED.last_date),
  updated_at = NOW();

-- PART 3: Update total_prs count on profiles
UPDATE profiles p
SET total_prs = (
  SELECT COUNT(*)
  FROM personal_records pr
  WHERE pr.user_id = p.id
)
WHERE EXISTS (
  SELECT 1 FROM personal_records pr WHERE pr.user_id = p.id
);
