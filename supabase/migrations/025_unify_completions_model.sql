-- ============================================
-- UNIFY COMPLETIONS MODEL
-- ============================================
-- Make completions the universal activity record for:
-- - Tag responses
-- - Challenge completions (legacy)
-- - Future workout step completions
-- ============================================

-- 1. Make challenge_id nullable (was NOT NULL)
ALTER TABLE completions ALTER COLUMN challenge_id DROP NOT NULL;

-- 2. Add new source columns
ALTER TABLE completions ADD COLUMN IF NOT EXISTS exercise_id UUID REFERENCES exercises(id) ON DELETE SET NULL;
ALTER TABLE completions ADD COLUMN IF NOT EXISTS tag_recipient_id UUID REFERENCES tag_recipients(id) ON DELETE SET NULL;
ALTER TABLE completions ADD COLUMN IF NOT EXISTS source_type TEXT CHECK (source_type IN ('tag', 'challenge', 'workout', 'freeform'));

-- 3. Set source_type for existing records
UPDATE completions SET source_type = 'challenge' WHERE challenge_id IS NOT NULL AND source_type IS NULL;

-- 4. Add constraint: must have at least one valid source
ALTER TABLE completions ADD CONSTRAINT completions_has_source CHECK (
  challenge_id IS NOT NULL OR
  exercise_id IS NOT NULL OR
  tag_recipient_id IS NOT NULL
);

-- 5. Add index for exercise-based queries
CREATE INDEX IF NOT EXISTS idx_completions_exercise ON completions(exercise_id) WHERE exercise_id IS NOT NULL AND deleted = FALSE;

-- 6. Add index for tag-based queries
CREATE INDEX IF NOT EXISTS idx_completions_tag_recipient ON completions(tag_recipient_id) WHERE tag_recipient_id IS NOT NULL AND deleted = FALSE;

-- 7. Add index for source_type queries
CREATE INDEX IF NOT EXISTS idx_completions_source_type ON completions(source_type, completed_at DESC) WHERE deleted = FALSE;

-- 8. Add completion_id to tag_recipients (links game state to activity record)
ALTER TABLE tag_recipients ADD COLUMN IF NOT EXISTS completion_id UUID REFERENCES completions(id) ON DELETE SET NULL;

-- 9. Create function to record tag completion (creates completion + updates recipient)
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
  SELECT
    v_user_id,
    v_exercise_id,
    p_tag_recipient_id,
    'tag',
    p_value,
    e.unit,
    p_proof_url,
    p_proof_type,
    NOW()
  FROM exercises e
  WHERE e.id = v_exercise_id
  RETURNING id INTO v_completion_id;

  -- Update tag_recipient with completion reference
  UPDATE tag_recipients
  SET
    status = 'completed',
    completion_id = v_completion_id,
    completed_at = NOW(),
    -- Keep these for now for backwards compatibility, will deprecate later
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

-- 10. Create function to record tag send (sender's completion)
CREATE OR REPLACE FUNCTION record_tag_send_completion(
  p_tag_id UUID,
  p_sender_id UUID,
  p_value INTEGER
)
RETURNS UUID AS $$
DECLARE
  v_completion_id UUID;
  v_exercise_id UUID;
  v_tag_recipient_id UUID;
BEGIN
  -- Get exercise from tag
  SELECT exercise_id INTO v_exercise_id FROM tags WHERE id = p_tag_id;

  -- Get sender's tag_recipient record (sender is added as completed recipient)
  SELECT id INTO v_tag_recipient_id
  FROM tag_recipients
  WHERE tag_id = p_tag_id AND recipient_id = p_sender_id;

  -- Create completion record for sender
  INSERT INTO completions (
    user_id,
    exercise_id,
    tag_recipient_id,
    source_type,
    value,
    unit,
    completed_at
  )
  SELECT
    p_sender_id,
    v_exercise_id,
    v_tag_recipient_id,
    'tag',
    p_value,
    e.unit,
    NOW()
  FROM exercises e
  WHERE e.id = v_exercise_id
  RETURNING id INTO v_completion_id;

  -- Link completion to tag_recipient
  IF v_tag_recipient_id IS NOT NULL THEN
    UPDATE tag_recipients
    SET completion_id = v_completion_id
    WHERE id = v_tag_recipient_id;
  END IF;

  RETURN v_completion_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comments
COMMENT ON COLUMN completions.source_type IS 'Type of activity: tag, challenge, workout, or freeform';
COMMENT ON COLUMN completions.exercise_id IS 'Direct exercise reference (for tags and freeform)';
COMMENT ON COLUMN completions.tag_recipient_id IS 'Link to tag_recipient if this completion is from a tag response';
COMMENT ON COLUMN tag_recipients.completion_id IS 'Link to the completion record (activity data lives there)';
COMMENT ON FUNCTION complete_tag_response IS 'Creates completion record and updates tag_recipient status atomically';
COMMENT ON FUNCTION record_tag_send_completion IS 'Records the sender completion when creating a tag';
