-- Migration: Add Exercise Variants
-- Allows exercises to be linked as scaled variants of parent exercises
-- e.g., Knee Pushups count as 0.5x toward Pushups total

-- ============================================
-- EXERCISE VARIANTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS exercise_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_exercise_id UUID NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
  variant_exercise_id UUID NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
  scaling_factor DECIMAL(3,2) NOT NULL CHECK (scaling_factor > 0 AND scaling_factor <= 1.00),
  description TEXT, -- e.g., "Counts as 50% toward parent exercise"
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Ensure no duplicate variant relationships
  UNIQUE(parent_exercise_id, variant_exercise_id),

  -- Prevent self-referencing variants
  CHECK (parent_exercise_id != variant_exercise_id)
);

-- Index for efficient lookups
CREATE INDEX IF NOT EXISTS idx_exercise_variants_parent ON exercise_variants(parent_exercise_id);
CREATE INDEX IF NOT EXISTS idx_exercise_variants_variant ON exercise_variants(variant_exercise_id);

-- Auto-update timestamps
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_updated_at_exercise_variants') THEN
    CREATE TRIGGER set_updated_at_exercise_variants
    BEFORE UPDATE ON exercise_variants
    FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
  END IF;
END $$;

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================
ALTER TABLE exercise_variants ENABLE ROW LEVEL SECURITY;

-- Exercise variants are publicly readable (like exercises)
DO $$ BEGIN
  CREATE POLICY "Exercise variants are viewable by everyone"
    ON exercise_variants FOR SELECT USING (TRUE);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============================================
-- REALTIME
-- ============================================
ALTER PUBLICATION supabase_realtime ADD TABLE exercise_variants;

-- ============================================
-- SEED NEW VARIANT EXERCISES
-- ============================================

-- First, add the new variant exercises to the exercises table
INSERT INTO exercises (name, category, type, unit, description, icon, difficulty, display_order) VALUES
  -- Pushup Variants
  ('Knee Pushups', 'upper_body', 'reps', 'count', 'Pushup with knees on the ground for reduced resistance', '🧎', 1, 1),
  ('Wall Pushups', 'upper_body', 'reps', 'count', 'Pushup against a wall for beginners', '🧱', 1, 1),

  -- Squat Variants
  ('Assisted Squats', 'lower_body', 'reps', 'count', 'Squat while holding onto support for balance', '🤝', 1, 20),

  -- Burpee Variants
  ('Half Burpees', 'full_body', 'reps', 'count', 'Burpee without the pushup component', '🔥', 2, 30),

  -- Plank Variants
  ('Knee Plank', 'core', 'time', 'seconds', 'Plank with knees on the ground for reduced difficulty', '🧎', 1, 12)
ON CONFLICT (name) DO UPDATE SET
  category = EXCLUDED.category,
  type = EXCLUDED.type,
  unit = EXCLUDED.unit,
  description = EXCLUDED.description,
  icon = EXCLUDED.icon,
  difficulty = EXCLUDED.difficulty,
  display_order = EXCLUDED.display_order,
  updated_at = NOW();

-- ============================================
-- SEED VARIANT RELATIONSHIPS
-- ============================================
-- Link variant exercises to their parent exercises with scaling factors

DO $$
DECLARE
  v_pushups_id UUID;
  v_knee_pushups_id UUID;
  v_wall_pushups_id UUID;
  v_squats_id UUID;
  v_assisted_squats_id UUID;
  v_burpees_id UUID;
  v_half_burpees_id UUID;
  v_plank_id UUID;
  v_knee_plank_id UUID;
BEGIN
  -- Get exercise IDs
  SELECT id INTO v_pushups_id FROM exercises WHERE name = 'Pushups';
  SELECT id INTO v_knee_pushups_id FROM exercises WHERE name = 'Knee Pushups';
  SELECT id INTO v_wall_pushups_id FROM exercises WHERE name = 'Wall Pushups';
  SELECT id INTO v_squats_id FROM exercises WHERE name = 'Squats';
  SELECT id INTO v_assisted_squats_id FROM exercises WHERE name = 'Assisted Squats';
  SELECT id INTO v_burpees_id FROM exercises WHERE name = 'Burpees';
  SELECT id INTO v_half_burpees_id FROM exercises WHERE name = 'Half Burpees';
  SELECT id INTO v_plank_id FROM exercises WHERE name = 'Plank';
  SELECT id INTO v_knee_plank_id FROM exercises WHERE name = 'Knee Plank';

  -- Insert variant relationships
  -- Knee Pushups → Pushups (0.50x)
  IF v_pushups_id IS NOT NULL AND v_knee_pushups_id IS NOT NULL THEN
    INSERT INTO exercise_variants (parent_exercise_id, variant_exercise_id, scaling_factor, description)
    VALUES (v_pushups_id, v_knee_pushups_id, 0.50, 'Counts as 50% toward Pushups')
    ON CONFLICT (parent_exercise_id, variant_exercise_id) DO UPDATE SET
      scaling_factor = EXCLUDED.scaling_factor,
      description = EXCLUDED.description,
      updated_at = NOW();
  END IF;

  -- Wall Pushups → Pushups (0.25x)
  IF v_pushups_id IS NOT NULL AND v_wall_pushups_id IS NOT NULL THEN
    INSERT INTO exercise_variants (parent_exercise_id, variant_exercise_id, scaling_factor, description)
    VALUES (v_pushups_id, v_wall_pushups_id, 0.25, 'Counts as 25% toward Pushups')
    ON CONFLICT (parent_exercise_id, variant_exercise_id) DO UPDATE SET
      scaling_factor = EXCLUDED.scaling_factor,
      description = EXCLUDED.description,
      updated_at = NOW();
  END IF;

  -- Assisted Squats → Squats (0.75x)
  IF v_squats_id IS NOT NULL AND v_assisted_squats_id IS NOT NULL THEN
    INSERT INTO exercise_variants (parent_exercise_id, variant_exercise_id, scaling_factor, description)
    VALUES (v_squats_id, v_assisted_squats_id, 0.75, 'Counts as 75% toward Squats')
    ON CONFLICT (parent_exercise_id, variant_exercise_id) DO UPDATE SET
      scaling_factor = EXCLUDED.scaling_factor,
      description = EXCLUDED.description,
      updated_at = NOW();
  END IF;

  -- Half Burpees → Burpees (0.60x)
  IF v_burpees_id IS NOT NULL AND v_half_burpees_id IS NOT NULL THEN
    INSERT INTO exercise_variants (parent_exercise_id, variant_exercise_id, scaling_factor, description)
    VALUES (v_burpees_id, v_half_burpees_id, 0.60, 'Counts as 60% toward Burpees')
    ON CONFLICT (parent_exercise_id, variant_exercise_id) DO UPDATE SET
      scaling_factor = EXCLUDED.scaling_factor,
      description = EXCLUDED.description,
      updated_at = NOW();
  END IF;

  -- Knee Plank → Plank (0.50x)
  IF v_plank_id IS NOT NULL AND v_knee_plank_id IS NOT NULL THEN
    INSERT INTO exercise_variants (parent_exercise_id, variant_exercise_id, scaling_factor, description)
    VALUES (v_plank_id, v_knee_plank_id, 0.50, 'Counts as 50% toward Plank')
    ON CONFLICT (parent_exercise_id, variant_exercise_id) DO UPDATE SET
      scaling_factor = EXCLUDED.scaling_factor,
      description = EXCLUDED.description,
      updated_at = NOW();
  END IF;
END $$;

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function to get parent exercise info for a variant
CREATE OR REPLACE FUNCTION get_exercise_parent(p_exercise_id UUID)
RETURNS TABLE (
  parent_id UUID,
  parent_name TEXT,
  scaling_factor DECIMAL(3,2)
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    e.id AS parent_id,
    e.name AS parent_name,
    ev.scaling_factor
  FROM exercise_variants ev
    JOIN exercises e ON e.id = ev.parent_exercise_id
  WHERE ev.variant_exercise_id = p_exercise_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

-- Function to get all variants for an exercise
CREATE OR REPLACE FUNCTION get_exercise_variants(p_exercise_id UUID)
RETURNS TABLE (
  variant_id UUID,
  variant_name TEXT,
  variant_icon TEXT,
  scaling_factor DECIMAL(3,2),
  description TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    e.id AS variant_id,
    e.name AS variant_name,
    e.icon AS variant_icon,
    ev.scaling_factor,
    ev.description
  FROM exercise_variants ev
    JOIN exercises e ON e.id = ev.variant_exercise_id
  WHERE ev.parent_exercise_id = p_exercise_id
  ORDER BY ev.scaling_factor DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;
