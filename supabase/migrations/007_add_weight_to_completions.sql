-- Add weight field to completions for max effort challenges
-- Enables tracking both weight and reps for strength exercises

-- Add weight column (in lbs or kg, user can specify)
ALTER TABLE completions
ADD COLUMN IF NOT EXISTS weight DECIMAL(10, 2);

-- Add weight_unit column (lbs or kg)
ALTER TABLE completions
ADD COLUMN IF NOT EXISTS weight_unit TEXT DEFAULT 'lbs'
  CHECK (weight_unit IN ('lbs', 'kg'));

-- Add comment to clarify usage
COMMENT ON COLUMN completions.weight IS 'Weight lifted for max effort challenges (e.g., 225.0)';
COMMENT ON COLUMN completions.weight_unit IS 'Unit for weight measurement: lbs or kg';
COMMENT ON COLUMN completions.value IS 'Reps for max_effort/amrap, time for timed, distance for distance challenges';

-- The value field will now represent:
-- - AMRAP: reps completed
-- - Max Effort: reps completed (weight in weight field)
-- - Timed: time in seconds
-- - Distance: distance in meters

-- Index for querying by weight (for max effort leaderboards)
CREATE INDEX IF NOT EXISTS idx_completions_weight ON completions(weight) WHERE weight IS NOT NULL;
