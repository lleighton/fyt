-- Migration: Fix security vulnerabilities in personal records functions
-- Purpose: Add auth.uid() validation to prevent users from modifying other users' data

-- Fix update_personal_record - add security check
CREATE OR REPLACE FUNCTION public.update_personal_record(
  p_user_id UUID,
  p_exercise_id UUID,
  p_value INTEGER
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_existing RECORD;
  v_is_new_pr BOOLEAN := FALSE;
  v_previous_best INTEGER := NULL;
BEGIN
  -- SECURITY CHECK: Ensure user can only update their own records
  IF p_user_id != auth.uid() THEN
    RAISE EXCEPTION 'Access denied: Cannot update another user''s personal records';
  END IF;

  -- Get existing record
  SELECT * INTO v_existing
  FROM personal_records
  WHERE user_id = p_user_id AND exercise_id = p_exercise_id;

  IF v_existing IS NULL THEN
    -- First time doing this exercise - insert new record
    INSERT INTO personal_records (user_id, exercise_id, best_value, best_date, last_value, last_date, total_completions)
    VALUES (p_user_id, p_exercise_id, p_value, NOW(), p_value, NOW(), 1);

    v_is_new_pr := TRUE;

    -- Increment total PRs on profile
    UPDATE profiles SET total_prs = COALESCE(total_prs, 0) + 1 WHERE id = p_user_id;
  ELSE
    v_previous_best := v_existing.best_value;

    IF p_value > v_existing.best_value THEN
      -- New personal record!
      UPDATE personal_records
      SET
        best_value = p_value,
        best_date = NOW(),
        last_value = p_value,
        last_date = NOW(),
        total_completions = total_completions + 1,
        updated_at = NOW()
      WHERE user_id = p_user_id AND exercise_id = p_exercise_id;

      v_is_new_pr := TRUE;

      -- Increment total PRs on profile
      UPDATE profiles SET total_prs = COALESCE(total_prs, 0) + 1 WHERE id = p_user_id;
    ELSE
      -- Not a PR, just update last attempt
      UPDATE personal_records
      SET
        last_value = p_value,
        last_date = NOW(),
        total_completions = total_completions + 1,
        updated_at = NOW()
      WHERE user_id = p_user_id AND exercise_id = p_exercise_id;
    END IF;
  END IF;

  RETURN json_build_object(
    'is_new_pr', v_is_new_pr,
    'previous_best', v_previous_best,
    'current_best', GREATEST(COALESCE(v_previous_best, 0), p_value),
    'improvement', CASE
      WHEN v_previous_best IS NOT NULL AND p_value > v_previous_best
      THEN p_value - v_previous_best
      ELSE NULL
    END
  );
END;
$$;

-- Fix get_personal_record - add security check
CREATE OR REPLACE FUNCTION public.get_personal_record(
  p_user_id UUID,
  p_exercise_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_record RECORD;
BEGIN
  -- SECURITY CHECK: Ensure user can only read their own records
  IF p_user_id != auth.uid() THEN
    RAISE EXCEPTION 'Access denied: Cannot read another user''s personal records';
  END IF;

  SELECT * INTO v_record
  FROM personal_records
  WHERE user_id = p_user_id AND exercise_id = p_exercise_id;

  IF v_record IS NULL THEN
    RETURN json_build_object(
      'has_record', FALSE,
      'best_value', NULL,
      'last_value', NULL,
      'total_completions', 0
    );
  END IF;

  RETURN json_build_object(
    'has_record', TRUE,
    'best_value', v_record.best_value,
    'best_date', v_record.best_date,
    'last_value', v_record.last_value,
    'last_date', v_record.last_date,
    'total_completions', v_record.total_completions
  );
END;
$$;
