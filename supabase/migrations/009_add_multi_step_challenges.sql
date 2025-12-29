-- Add multi-step challenge support (e.g., Hyrox-style workouts)
-- Allows combining multiple exercises into a single challenge

-- Add steps field to challenges table
-- Stores array of step definitions: [{exercise, type, target_value, target_unit}]
ALTER TABLE challenges
ADD COLUMN IF NOT EXISTS steps JSONB;

COMMENT ON COLUMN challenges.steps IS 'Array of steps for multi-step challenges: [{exercise: string, type: string, target_value?: number, target_unit?: string}]';

-- Add step_data field to completions table
-- Stores individual step results: [{step_index, exercise, value, unit}]
ALTER TABLE completions
ADD COLUMN IF NOT EXISTS step_data JSONB;

COMMENT ON COLUMN completions.step_data IS 'Array of step completions: [{step_index: number, exercise: string, value: number, unit: string}]';

-- Index for querying multi-step challenges
CREATE INDEX IF NOT EXISTS idx_challenges_steps
  ON challenges USING GIN (steps)
  WHERE steps IS NOT NULL;

-- Index for querying completions with step data
CREATE INDEX IF NOT EXISTS idx_completions_step_data
  ON completions USING GIN (step_data)
  WHERE step_data IS NOT NULL;

-- Validation function to ensure step_data matches challenge steps
CREATE OR REPLACE FUNCTION validate_multi_step_completion()
RETURNS TRIGGER AS $$
DECLARE
  challenge_steps JSONB;
  step_count INT;
BEGIN
  -- Only validate if step_data is present
  IF NEW.step_data IS NOT NULL THEN
    -- Get the challenge steps
    SELECT steps INTO challenge_steps
    FROM challenges
    WHERE id = NEW.challenge_id;

    -- If challenge has steps, validate the completion
    IF challenge_steps IS NOT NULL THEN
      step_count := jsonb_array_length(challenge_steps);

      -- Ensure step_data has the right number of steps
      IF jsonb_array_length(NEW.step_data) != step_count THEN
        RAISE EXCEPTION 'step_data must have % steps to match challenge', step_count;
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for validation
DROP TRIGGER IF EXISTS trigger_validate_multi_step ON completions;
CREATE TRIGGER trigger_validate_multi_step
  BEFORE INSERT OR UPDATE ON completions
  FOR EACH ROW
  EXECUTE FUNCTION validate_multi_step_completion();

-- Grant execute permission
GRANT EXECUTE ON FUNCTION validate_multi_step_completion() TO authenticated;
