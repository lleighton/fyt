-- Fix completions unit constraint to allow 'count' from exercises table
-- The exercises table uses 'count' for reps, but completions was only allowing 'reps'

-- Drop old constraint and add new one with 'count' included
ALTER TABLE completions DROP CONSTRAINT IF EXISTS completions_unit_check;
ALTER TABLE completions ADD CONSTRAINT completions_unit_check
  CHECK (unit IN ('reps', 'count', 'lbs', 'kg', 'seconds', 'meters'));

-- Also update the complete_tag_response function to handle the unit mapping properly
CREATE OR REPLACE FUNCTION complete_tag_response(
  p_tag_recipient_id UUID,
  p_value INTEGER,
  p_proof_url TEXT DEFAULT NULL,
  p_proof_type TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_completion_id UUID;
  v_user_id UUID;
  v_exercise_id UUID;
  v_tag_id UUID;
  v_unit TEXT;
BEGIN
  -- Get recipient and tag info
  SELECT tr.recipient_id, t.exercise_id, t.id
  INTO v_user_id, v_exercise_id, v_tag_id
  FROM tag_recipients tr
  JOIN tags t ON t.id = tr.tag_id
  WHERE tr.id = p_tag_recipient_id;

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Tag recipient not found';
  END IF;

  -- Get unit from exercise
  SELECT unit INTO v_unit FROM exercises WHERE id = v_exercise_id;

  -- Create the completion record
  INSERT INTO completions (
    user_id,
    exercise_id,
    tag_recipient_id,
    source_type,
    value,
    unit,
    proof_url,
    proof_type,
    completed_at
  )
  VALUES (
    v_user_id,
    v_exercise_id,
    p_tag_recipient_id,
    'tag',
    p_value,
    v_unit,
    p_proof_url,
    p_proof_type,
    NOW()
  )
  RETURNING id INTO v_completion_id;

  -- Update tag_recipient with completion reference
  UPDATE tag_recipients
  SET
    status = 'completed',
    completion_id = v_completion_id,
    completed_at = NOW(),
    completed_value = p_value,
    proof_url = p_proof_url,
    proof_type = p_proof_type
  WHERE id = p_tag_recipient_id;

  -- Update user stats
  UPDATE profiles
  SET total_tags_completed = COALESCE(total_tags_completed, 0) + 1
  WHERE id = v_user_id;

  RETURN v_completion_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
