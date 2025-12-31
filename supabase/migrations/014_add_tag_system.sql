-- Migration: Add Tag System
-- This adds the Tag feature while preserving all existing functionality
-- Tags are a simplified, social-first challenge type focused on bodyweight exercises

-- ============================================
-- EXERCISES TABLE (Curated bodyweight exercises)
-- ============================================
CREATE TABLE IF NOT EXISTS exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL CHECK (category IN ('upper_body', 'core', 'lower_body', 'full_body')),
  type TEXT NOT NULL CHECK (type IN ('reps', 'time')),
  unit TEXT NOT NULL CHECK (unit IN ('count', 'seconds')),
  description TEXT,
  instructions TEXT,
  icon TEXT, -- emoji or icon name
  difficulty INTEGER DEFAULT 1 CHECK (difficulty BETWEEN 1 AND 3), -- 1=easy, 2=medium, 3=hard
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_exercises_category ON exercises(category) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_exercises_display ON exercises(display_order, name) WHERE is_active = TRUE;

-- ============================================
-- TAGS TABLE (Core tag record)
-- ============================================
CREATE TABLE IF NOT EXISTS tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id UUID REFERENCES challenges(id) ON DELETE SET NULL, -- Links to existing challenge system for compatibility
  sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  exercise_id UUID NOT NULL REFERENCES exercises(id) ON DELETE RESTRICT,
  value INTEGER NOT NULL CHECK (value > 0), -- reps or seconds
  proof_url TEXT,
  proof_type TEXT CHECK (proof_type IN ('photo', 'video', NULL)),
  is_public BOOLEAN DEFAULT TRUE,
  group_id UUID REFERENCES groups(id) ON DELETE SET NULL, -- Optional: tag within a group
  expires_at TIMESTAMPTZ NOT NULL, -- 24h from creation (or 48h for new users)
  parent_tag_id UUID REFERENCES tags(id) ON DELETE SET NULL, -- for tag-backs, tracks chain
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted BOOLEAN DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_tags_sender ON tags(sender_id) WHERE deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_tags_exercise ON tags(exercise_id) WHERE deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_tags_expires ON tags(expires_at) WHERE deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_tags_group ON tags(group_id) WHERE deleted = FALSE AND group_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tags_parent ON tags(parent_tag_id) WHERE parent_tag_id IS NOT NULL;

-- ============================================
-- TAG RECIPIENTS TABLE (Who was tagged)
-- ============================================
CREATE TABLE IF NOT EXISTS tag_recipients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  recipient_id UUID REFERENCES profiles(id) ON DELETE CASCADE, -- null if external invite
  recipient_phone TEXT, -- for external invites (not on platform yet)
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'expired', 'declined')),
  completed_value INTEGER, -- their result (must match or beat sender's value)
  completed_at TIMESTAMPTZ,
  proof_url TEXT,
  proof_type TEXT CHECK (proof_type IN ('photo', 'video', NULL)),
  response_tag_id UUID REFERENCES tags(id) ON DELETE SET NULL, -- if they tagged back
  notified_at TIMESTAMPTZ, -- when we sent notification
  reminder_sent_at TIMESTAMPTZ, -- when we sent 6h/1h reminder
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tag_id, recipient_id)
);

CREATE INDEX IF NOT EXISTS idx_tag_recipients_recipient ON tag_recipients(recipient_id) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_tag_recipients_tag ON tag_recipients(tag_id);
CREATE INDEX IF NOT EXISTS idx_tag_recipients_phone ON tag_recipients(recipient_phone) WHERE recipient_phone IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tag_recipients_status ON tag_recipients(status, created_at DESC);

-- ============================================
-- STREAKS TABLE (Track tag streaks)
-- ============================================
CREATE TABLE IF NOT EXISTS streaks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  streak_type TEXT NOT NULL CHECK (streak_type IN ('pair', 'public', 'group')),
  partner_id UUID REFERENCES profiles(id) ON DELETE CASCADE, -- for pair streaks
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE, -- for group streaks
  current_count INTEGER DEFAULT 0,
  longest_count INTEGER DEFAULT 0,
  last_activity_at TIMESTAMPTZ,
  streak_started_at TIMESTAMPTZ, -- when current streak began
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  -- Ensure unique streak records per type
  UNIQUE NULLS NOT DISTINCT (user_id, streak_type, partner_id, group_id)
);

CREATE INDEX IF NOT EXISTS idx_streaks_user ON streaks(user_id);
CREATE INDEX IF NOT EXISTS idx_streaks_pair ON streaks(user_id, partner_id) WHERE streak_type = 'pair';
CREATE INDEX IF NOT EXISTS idx_streaks_group ON streaks(user_id, group_id) WHERE streak_type = 'group';
CREATE INDEX IF NOT EXISTS idx_streaks_public ON streaks(user_id) WHERE streak_type = 'public';

-- ============================================
-- ADD COLUMNS TO EXISTING TABLES
-- ============================================

-- Add tag-related columns to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS tag_streak_public INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS tag_streak_longest INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS total_tags_sent INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS total_tags_completed INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS first_tag_completed_at TIMESTAMPTZ; -- for new user grace period check

-- Add tag flag to challenges (for backwards compatibility)
ALTER TABLE challenges ADD COLUMN IF NOT EXISTS is_tag BOOLEAN DEFAULT FALSE;
ALTER TABLE challenges ADD COLUMN IF NOT EXISTS tag_id UUID REFERENCES tags(id) ON DELETE SET NULL;

-- Add index for tag-type challenges
CREATE INDEX IF NOT EXISTS idx_challenges_is_tag ON challenges(is_tag) WHERE is_tag = TRUE AND deleted = FALSE;

-- ============================================
-- TRIGGERS
-- ============================================

-- Auto-update timestamps for new tables
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_updated_at_exercises') THEN
    CREATE TRIGGER set_updated_at_exercises BEFORE UPDATE ON exercises FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_updated_at_tags') THEN
    CREATE TRIGGER set_updated_at_tags BEFORE UPDATE ON tags FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_updated_at_tag_recipients') THEN
    CREATE TRIGGER set_updated_at_tag_recipients BEFORE UPDATE ON tag_recipients FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_updated_at_streaks') THEN
    CREATE TRIGGER set_updated_at_streaks BEFORE UPDATE ON streaks FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
  END IF;
END $$;

-- Update profile stats when tag is sent
CREATE OR REPLACE FUNCTION update_profile_tags_sent()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE profiles
  SET total_tags_sent = total_tags_sent + 1
  WHERE id = NEW.sender_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_tags_sent_on_create') THEN
    CREATE TRIGGER update_tags_sent_on_create
    AFTER INSERT ON tags
    FOR EACH ROW EXECUTE FUNCTION update_profile_tags_sent();
  END IF;
END $$;

-- Update profile stats when tag is completed
CREATE OR REPLACE FUNCTION update_profile_tags_completed()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    UPDATE profiles
    SET
      total_tags_completed = total_tags_completed + 1,
      first_tag_completed_at = COALESCE(first_tag_completed_at, NOW())
    WHERE id = NEW.recipient_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_tags_completed_on_complete') THEN
    CREATE TRIGGER update_tags_completed_on_complete
    AFTER INSERT OR UPDATE ON tag_recipients
    FOR EACH ROW EXECUTE FUNCTION update_profile_tags_completed();
  END IF;
END $$;

-- Auto-expire tags when time runs out (for use with pg_cron or scheduled function)
CREATE OR REPLACE FUNCTION expire_pending_tags()
RETURNS INTEGER AS $$
DECLARE
  expired_count INTEGER;
BEGIN
  UPDATE tag_recipients
  SET status = 'expired', updated_at = NOW()
  WHERE status = 'pending'
    AND EXISTS (
      SELECT 1 FROM tags t
      WHERE t.id = tag_recipients.tag_id
      AND t.expires_at < NOW()
      AND t.deleted = FALSE
    );

  GET DIAGNOSTICS expired_count = ROW_COUNT;
  RETURN expired_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE tag_recipients ENABLE ROW LEVEL SECURITY;
ALTER TABLE streaks ENABLE ROW LEVEL SECURITY;

-- EXERCISES (public read, admin write)
DO $$ BEGIN
  CREATE POLICY "Exercises are viewable by everyone" ON exercises FOR SELECT USING (is_active = TRUE);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- TAGS
DO $$ BEGIN
  CREATE POLICY "Tags are viewable by sender and recipients" ON tags FOR SELECT
    USING (
      deleted = FALSE AND (
        sender_id = auth.uid()
        OR is_public = TRUE
        OR EXISTS (SELECT 1 FROM tag_recipients WHERE tag_id = tags.id AND recipient_id = auth.uid())
        OR (group_id IS NOT NULL AND EXISTS (
          SELECT 1 FROM group_members WHERE group_id = tags.group_id AND user_id = auth.uid()
        ))
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can create tags" ON tags FOR INSERT WITH CHECK (auth.uid() = sender_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Senders can update own tags" ON tags FOR UPDATE USING (auth.uid() = sender_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- TAG RECIPIENTS
DO $$ BEGIN
  CREATE POLICY "Tag recipients are viewable by involved parties" ON tag_recipients FOR SELECT
    USING (
      recipient_id = auth.uid()
      OR EXISTS (SELECT 1 FROM tags WHERE id = tag_recipients.tag_id AND sender_id = auth.uid())
      OR EXISTS (
        SELECT 1 FROM tags t
        WHERE t.id = tag_recipients.tag_id
        AND t.is_public = TRUE
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Tag senders can create recipients" ON tag_recipients FOR INSERT
    WITH CHECK (
      EXISTS (SELECT 1 FROM tags WHERE id = tag_recipients.tag_id AND sender_id = auth.uid())
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Recipients can update their own record" ON tag_recipients FOR UPDATE
    USING (recipient_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- STREAKS
DO $$ BEGIN
  CREATE POLICY "Users can view own streaks" ON streaks FOR SELECT USING (user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can view partner streaks" ON streaks FOR SELECT
    USING (partner_id = auth.uid() AND streak_type = 'pair');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "System can manage streaks" ON streaks FOR ALL USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============================================
-- REALTIME
-- ============================================
ALTER PUBLICATION supabase_realtime ADD TABLE tags;
ALTER PUBLICATION supabase_realtime ADD TABLE tag_recipients;
ALTER PUBLICATION supabase_realtime ADD TABLE streaks;

-- ============================================
-- SEED DATA: Bodyweight Exercises
-- ============================================
INSERT INTO exercises (name, category, type, unit, description, icon, difficulty, display_order) VALUES
  -- Upper Body
  ('Pushups', 'upper_body', 'reps', 'count', 'Standard pushup with hands shoulder-width apart', '💪', 1, 1),
  ('Diamond Pushups', 'upper_body', 'reps', 'count', 'Pushup with hands forming a diamond shape', '💎', 2, 2),
  ('Wide Pushups', 'upper_body', 'reps', 'count', 'Pushup with hands wider than shoulder-width', '🦅', 1, 3),
  ('Pike Pushups', 'upper_body', 'reps', 'count', 'Pushup in an inverted V position targeting shoulders', '🔺', 2, 4),
  ('Decline Pushups', 'upper_body', 'reps', 'count', 'Pushup with feet elevated on a surface', '📐', 2, 5),
  ('Dips', 'upper_body', 'reps', 'count', 'Tricep dips using a chair, bench, or parallel bars', '🪑', 2, 6),

  -- Core
  ('Sit-ups', 'core', 'reps', 'count', 'Full sit-up from lying to seated position', '🔄', 1, 10),
  ('Crunches', 'core', 'reps', 'count', 'Partial sit-up focusing on upper abs', '🎯', 1, 11),
  ('Plank', 'core', 'time', 'seconds', 'Hold a straight-arm or forearm plank position', '📏', 1, 12),
  ('Side Plank', 'core', 'time', 'seconds', 'Hold a side plank position (each side)', '↔️', 2, 13),
  ('Leg Raises', 'core', 'reps', 'count', 'Raise straight legs while lying on back', '🦵', 2, 14),
  ('Mountain Climbers', 'core', 'reps', 'count', 'Alternating knee drives from plank position', '⛰️', 2, 15),
  ('Bicycle Crunches', 'core', 'reps', 'count', 'Alternating elbow-to-knee crunches', '🚴', 2, 16),
  ('Dead Bug', 'core', 'reps', 'count', 'Alternating arm and leg extensions while on back', '🪲', 1, 17),

  -- Lower Body
  ('Squats', 'lower_body', 'reps', 'count', 'Standard bodyweight squat', '🏋️', 1, 20),
  ('Jump Squats', 'lower_body', 'reps', 'count', 'Squat with explosive jump at the top', '🦘', 2, 21),
  ('Lunges', 'lower_body', 'reps', 'count', 'Alternating forward lunges (total count)', '🚶', 1, 22),
  ('Walking Lunges', 'lower_body', 'reps', 'count', 'Continuous forward lunges (total steps)', '🚶‍♂️', 2, 23),
  ('Calf Raises', 'lower_body', 'reps', 'count', 'Rise up on toes and lower back down', '🦶', 1, 24),
  ('Wall Sit', 'lower_body', 'time', 'seconds', 'Hold seated position against a wall', '🧱', 2, 25),
  ('Glute Bridges', 'lower_body', 'reps', 'count', 'Raise hips while lying on back with knees bent', '🌉', 1, 26),
  ('Single Leg Squats', 'lower_body', 'reps', 'count', 'Squat on one leg (pistol squat variation)', '🎯', 3, 27),

  -- Full Body
  ('Burpees', 'full_body', 'reps', 'count', 'Squat thrust with pushup and jump', '🔥', 3, 30),
  ('Jumping Jacks', 'full_body', 'reps', 'count', 'Classic jumping jack exercise', '⭐', 1, 31),
  ('High Knees', 'full_body', 'reps', 'count', 'Running in place with high knee lifts (total count)', '🏃', 2, 32),
  ('Star Jumps', 'full_body', 'reps', 'count', 'Jump with arms and legs spread like a star', '✨', 2, 33)
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
-- HELPER FUNCTIONS
-- ============================================

-- Function to get pending tags for a user
CREATE OR REPLACE FUNCTION get_pending_tags(p_user_id UUID)
RETURNS TABLE (
  tag_id UUID,
  sender_id UUID,
  sender_name TEXT,
  sender_avatar TEXT,
  exercise_id UUID,
  exercise_name TEXT,
  exercise_icon TEXT,
  exercise_type TEXT,
  exercise_unit TEXT,
  sender_value INTEGER,
  expires_at TIMESTAMPTZ,
  time_remaining INTERVAL,
  is_public BOOLEAN,
  group_id UUID,
  group_name TEXT,
  recipient_id UUID,
  recipient_status TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    t.id AS tag_id,
    t.sender_id,
    p.display_name AS sender_name,
    p.avatar_url AS sender_avatar,
    t.exercise_id,
    e.name AS exercise_name,
    e.icon AS exercise_icon,
    e.type AS exercise_type,
    e.unit AS exercise_unit,
    t.value AS sender_value,
    t.expires_at,
    (t.expires_at - NOW()) AS time_remaining,
    t.is_public,
    t.group_id,
    g.name AS group_name,
    tr.recipient_id,
    tr.status AS recipient_status
  FROM tag_recipients tr
    JOIN tags t ON t.id = tr.tag_id
    JOIN exercises e ON e.id = t.exercise_id
    JOIN profiles p ON p.id = t.sender_id
    LEFT JOIN groups g ON g.id = t.group_id
  WHERE tr.recipient_id = p_user_id
    AND tr.status = 'pending'
    AND t.deleted = FALSE
    AND t.expires_at > NOW()
  ORDER BY t.expires_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get streak info between two users
CREATE OR REPLACE FUNCTION get_pair_streak(p_user_id UUID, p_partner_id UUID)
RETURNS TABLE (
  current_count INTEGER,
  longest_count INTEGER,
  last_activity_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT s.current_count, s.longest_count, s.last_activity_at
  FROM streaks s
  WHERE s.user_id = p_user_id
    AND s.partner_id = p_partner_id
    AND s.streak_type = 'pair'
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to calculate and update streaks (call after tag completion)
CREATE OR REPLACE FUNCTION update_tag_streak(
  p_user_id UUID,
  p_streak_type TEXT,
  p_partner_id UUID DEFAULT NULL,
  p_group_id UUID DEFAULT NULL
)
RETURNS void AS $$
DECLARE
  v_streak_id UUID;
  v_current_count INTEGER;
  v_longest_count INTEGER;
BEGIN
  -- Find or create streak record
  SELECT id, current_count, longest_count INTO v_streak_id, v_current_count, v_longest_count
  FROM streaks
  WHERE user_id = p_user_id
    AND streak_type = p_streak_type
    AND (partner_id IS NOT DISTINCT FROM p_partner_id)
    AND (group_id IS NOT DISTINCT FROM p_group_id);

  IF v_streak_id IS NULL THEN
    -- Create new streak
    INSERT INTO streaks (user_id, streak_type, partner_id, group_id, current_count, longest_count, last_activity_at, streak_started_at)
    VALUES (p_user_id, p_streak_type, p_partner_id, p_group_id, 1, 1, NOW(), NOW());
  ELSE
    -- Update existing streak
    v_current_count := v_current_count + 1;
    IF v_current_count > v_longest_count THEN
      v_longest_count := v_current_count;
    END IF;

    UPDATE streaks
    SET current_count = v_current_count,
        longest_count = v_longest_count,
        last_activity_at = NOW()
    WHERE id = v_streak_id;
  END IF;

  -- Update profile public streak if applicable
  IF p_streak_type = 'public' THEN
    UPDATE profiles
    SET tag_streak_public = v_current_count,
        tag_streak_longest = GREATEST(tag_streak_longest, v_current_count)
    WHERE id = p_user_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to break streak (call when tag expires)
CREATE OR REPLACE FUNCTION break_tag_streak(
  p_user_id UUID,
  p_streak_type TEXT,
  p_partner_id UUID DEFAULT NULL,
  p_group_id UUID DEFAULT NULL
)
RETURNS void AS $$
BEGIN
  UPDATE streaks
  SET current_count = 0,
      streak_started_at = NULL,
      updated_at = NOW()
  WHERE user_id = p_user_id
    AND streak_type = p_streak_type
    AND (partner_id IS NOT DISTINCT FROM p_partner_id)
    AND (group_id IS NOT DISTINCT FROM p_group_id);

  -- Update profile public streak if applicable
  IF p_streak_type = 'public' THEN
    UPDATE profiles
    SET tag_streak_public = 0
    WHERE id = p_user_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
