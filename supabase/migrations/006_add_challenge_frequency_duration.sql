-- Add challenge frequency and duration options
-- Enables one-shot, recurring (daily/weekly), and duration-based challenges

-- Add frequency column (one_time, daily, weekly, monthly)
ALTER TABLE challenges
ADD COLUMN IF NOT EXISTS frequency TEXT DEFAULT 'one_time'
  CHECK (frequency IN ('one_time', 'daily', 'weekly', 'monthly'));

-- Add duration_days column (null for infinite/until ends_at, number for fixed duration)
ALTER TABLE challenges
ADD COLUMN IF NOT EXISTS duration_days INT;

-- Add comment to clarify usage
COMMENT ON COLUMN challenges.frequency IS 'Challenge recurrence: one_time (single event), daily, weekly, monthly';
COMMENT ON COLUMN challenges.duration_days IS 'Challenge duration in days (null = use ends_at, number = fixed duration from starts_at)';

-- Update existing challenges to have default values
UPDATE challenges
SET frequency = 'one_time'
WHERE frequency IS NULL;

-- Index for querying active challenges by frequency
CREATE INDEX IF NOT EXISTS idx_challenges_frequency ON challenges(frequency, starts_at) WHERE deleted = FALSE;
