-- Migration 010: Simplify Challenge Type Structure
-- Refactors challenge types from 5 confusing types to 4 clear types

-- Update existing challenges to new type system
-- Old: amrap, max_effort, timed, distance, multi_step
-- New: amrap, max_effort, for_time, workout

-- 1. Rename 'timed' to 'for_time'
UPDATE challenges
SET challenge_type = 'for_time'
WHERE challenge_type = 'timed';

-- 2. Merge 'distance' into 'for_time' (distance challenges are just "for time" with distance units)
UPDATE challenges
SET challenge_type = 'for_time'
WHERE challenge_type = 'distance';

-- 3. Rename 'multi_step' to 'workout'
UPDATE challenges
SET challenge_type = 'workout'
WHERE challenge_type = 'multi_step';

-- 4. Update the check constraint on challenge_type column
-- First, drop the existing constraint
ALTER TABLE challenges DROP CONSTRAINT IF EXISTS challenges_challenge_type_check;

-- Then, add the new constraint with updated types
ALTER TABLE challenges ADD CONSTRAINT challenges_challenge_type_check
CHECK (challenge_type IN ('amrap', 'max_effort', 'for_time', 'workout'));

-- Note: Step types remain flexible and are validated in application code
-- Step types: 'reps', 'time', 'distance', 'strength'
-- This allows workouts to mix different exercise types

COMMENT ON COLUMN challenges.challenge_type IS '
Challenge type taxonomy:
- amrap: Max reps or rounds in time limit (can be simple or multi-round)
- max_effort: Heaviest weight × reps (strength PRs)
- for_time: Fastest time to complete target (can be simple or multi-round)
- workout: Multi-exercise circuits or structured programs (sequential or mixed)
';
