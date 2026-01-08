-- Migration: Add personal records tracking
-- Purpose: Track personal bests per exercise to enable self-improvement focus

-- Create personal_records table
CREATE TABLE IF NOT EXISTS public.personal_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  exercise_id UUID REFERENCES public.exercises(id) ON DELETE CASCADE NOT NULL,
  best_value INTEGER NOT NULL, -- personal best reps or seconds
  best_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  total_completions INTEGER DEFAULT 1,
  last_value INTEGER, -- most recent attempt
  last_date TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, exercise_id)
);

-- Add index for quick lookups
CREATE INDEX IF NOT EXISTS idx_personal_records_user ON public.personal_records(user_id);
CREATE INDEX IF NOT EXISTS idx_personal_records_exercise ON public.personal_records(exercise_id);

-- Add total_prs counter to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS total_prs INTEGER DEFAULT 0;

-- Enable RLS
ALTER TABLE public.personal_records ENABLE ROW LEVEL SECURITY;

-- RLS policies for personal_records
-- Users can read their own records
CREATE POLICY "Users can read own personal records"
  ON public.personal_records
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Users can insert their own records
CREATE POLICY "Users can insert own personal records"
  ON public.personal_records
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Users can update their own records
CREATE POLICY "Users can update own personal records"
  ON public.personal_records
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Function to update personal record after tag completion
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

-- Function to get user's personal record for an exercise
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

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.update_personal_record TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_personal_record TO authenticated;
