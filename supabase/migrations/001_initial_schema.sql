-- FitChallenge Initial Schema
-- Apply this in Supabase SQL Editor or via CLI

-- Enable extensions
-- pgcrypto for extensions.gen_random_bytes() used in invite codes
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

-- ============================================
-- PROFILES
-- ============================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  phone_number TEXT UNIQUE NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  streak_count INT DEFAULT 0,
  longest_streak INT DEFAULT 0,
  total_completions INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted BOOLEAN DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_profiles_phone ON profiles(phone_number);

-- ============================================
-- GROUPS
-- ============================================
CREATE TABLE IF NOT EXISTS groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  avatar_url TEXT,
  is_private BOOLEAN DEFAULT FALSE,
  invite_code TEXT UNIQUE DEFAULT encode(extensions.gen_random_bytes(6), 'hex'),
  creator_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  member_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted BOOLEAN DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_groups_invite_code ON groups(invite_code) WHERE deleted = FALSE;

-- ============================================
-- GROUP MEMBERS
-- ============================================
CREATE TABLE IF NOT EXISTS group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(group_id, user_id)
);

-- ============================================
-- CHALLENGES
-- ============================================
CREATE TABLE IF NOT EXISTS challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  group_id UUID REFERENCES groups(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  challenge_type TEXT NOT NULL CHECK (challenge_type IN ('amrap', 'max_effort', 'timed', 'distance')),
  exercise TEXT NOT NULL,
  config JSONB DEFAULT '{}',
  is_public BOOLEAN DEFAULT TRUE,
  starts_at TIMESTAMPTZ DEFAULT NOW(),
  ends_at TIMESTAMPTZ,
  participant_count INT DEFAULT 0,
  completion_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted BOOLEAN DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_challenges_creator ON challenges(creator_id) WHERE deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_challenges_group ON challenges(group_id) WHERE deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_challenges_public ON challenges(is_public, starts_at DESC) WHERE deleted = FALSE;

-- ============================================
-- CHALLENGE PARTICIPANTS
-- ============================================
CREATE TABLE IF NOT EXISTS challenge_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id UUID NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  invited_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  invited_phone TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  joined_at TIMESTAMPTZ,
  best_value INT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(challenge_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_participants_user ON challenge_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_participants_challenge ON challenge_participants(challenge_id);
CREATE INDEX IF NOT EXISTS idx_participants_phone ON challenge_participants(invited_phone) WHERE invited_phone IS NOT NULL;

-- ============================================
-- COMPLETIONS
-- ============================================
CREATE TABLE IF NOT EXISTS completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  challenge_id UUID NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
  value INT NOT NULL,
  unit TEXT DEFAULT 'reps' CHECK (unit IN ('reps', 'lbs', 'kg', 'seconds', 'meters')),
  proof_url TEXT,
  proof_type TEXT CHECK (proof_type IN ('photo', 'video', NULL)),
  verified BOOLEAN DEFAULT FALSE,
  verified_by UUID REFERENCES profiles(id),
  notes TEXT,
  location_lat DECIMAL(10, 8),
  location_lng DECIMAL(11, 8),
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted BOOLEAN DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_completions_user ON completions(user_id, completed_at DESC) WHERE deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_completions_challenge ON completions(challenge_id) WHERE deleted = FALSE;
-- Use timezone-aware date extraction (immutable)
CREATE INDEX IF NOT EXISTS idx_completions_date ON completions(((completed_at AT TIME ZONE 'UTC')::date)) WHERE deleted = FALSE;

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Auto-update timestamps
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers (using CREATE OR REPLACE pattern via DO block)
DO $$
BEGIN
  -- Updated_at triggers
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_updated_at_profiles') THEN
    CREATE TRIGGER set_updated_at_profiles BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_updated_at_groups') THEN
    CREATE TRIGGER set_updated_at_groups BEFORE UPDATE ON groups FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_updated_at_group_members') THEN
    CREATE TRIGGER set_updated_at_group_members BEFORE UPDATE ON group_members FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_updated_at_challenges') THEN
    CREATE TRIGGER set_updated_at_challenges BEFORE UPDATE ON challenges FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_updated_at_participants') THEN
    CREATE TRIGGER set_updated_at_participants BEFORE UPDATE ON challenge_participants FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_updated_at_completions') THEN
    CREATE TRIGGER set_updated_at_completions BEFORE UPDATE ON completions FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
  END IF;
END $$;

-- Update participant best value on completion
CREATE OR REPLACE FUNCTION update_participant_best()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE challenge_participants
  SET best_value = GREATEST(COALESCE(best_value, 0), NEW.value)
  WHERE challenge_id = NEW.challenge_id AND user_id = NEW.user_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_best_on_completion') THEN
    CREATE TRIGGER update_best_on_completion
    AFTER INSERT ON completions
    FOR EACH ROW EXECUTE FUNCTION update_participant_best();
  END IF;
END $$;

-- Update profile stats on completion
CREATE OR REPLACE FUNCTION update_profile_stats()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE profiles
  SET total_completions = total_completions + 1
  WHERE id = NEW.user_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_stats_on_completion') THEN
    CREATE TRIGGER update_stats_on_completion
    AFTER INSERT ON completions
    FOR EACH ROW EXECUTE FUNCTION update_profile_stats();
  END IF;
END $$;

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenge_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE completions ENABLE ROW LEVEL SECURITY;

-- PROFILES
DO $$ BEGIN
  CREATE POLICY "Public profiles are viewable by everyone" ON profiles FOR SELECT USING (deleted = FALSE);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- GROUPS
DO $$ BEGIN
  CREATE POLICY "Groups are viewable" ON groups FOR SELECT
    USING (deleted = FALSE AND (is_private = FALSE OR creator_id = auth.uid() OR EXISTS (
      SELECT 1 FROM group_members WHERE group_id = groups.id AND user_id = auth.uid()
    )));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can create groups" ON groups FOR INSERT WITH CHECK (auth.uid() = creator_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Admins can update groups" ON groups FOR UPDATE
    USING (EXISTS (
      SELECT 1 FROM group_members WHERE group_id = groups.id AND user_id = auth.uid() AND role = 'admin'
    ));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- GROUP MEMBERS
DO $$ BEGIN
  CREATE POLICY "Group members are viewable by group members" ON group_members FOR SELECT
    USING (EXISTS (
      SELECT 1 FROM group_members gm WHERE gm.group_id = group_members.group_id AND gm.user_id = auth.uid()
    ));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can join groups" ON group_members FOR INSERT WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can leave groups" ON group_members FOR DELETE USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- CHALLENGES
DO $$ BEGIN
  CREATE POLICY "Public challenges are viewable" ON challenges FOR SELECT
    USING (deleted = FALSE AND (
      is_public = TRUE 
      OR creator_id = auth.uid()
      OR EXISTS (SELECT 1 FROM challenge_participants WHERE challenge_id = challenges.id AND user_id = auth.uid())
    ));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can create challenges" ON challenges FOR INSERT WITH CHECK (auth.uid() = creator_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Creators can update challenges" ON challenges FOR UPDATE USING (auth.uid() = creator_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- CHALLENGE PARTICIPANTS
DO $$ BEGIN
  CREATE POLICY "Participants are viewable" ON challenge_participants FOR SELECT
    USING (EXISTS (
      SELECT 1 FROM challenge_participants cp WHERE cp.challenge_id = challenge_participants.challenge_id AND cp.user_id = auth.uid()
    ) OR EXISTS (
      SELECT 1 FROM challenges c WHERE c.id = challenge_participants.challenge_id AND c.is_public = TRUE
    ));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can be invited to challenges" ON challenge_participants FOR INSERT
    WITH CHECK (auth.uid() = invited_by OR auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can update own participation" ON challenge_participants FOR UPDATE USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- COMPLETIONS
DO $$ BEGIN
  CREATE POLICY "Completions are viewable" ON completions FOR SELECT
    USING (deleted = FALSE AND (
      user_id = auth.uid()
      OR EXISTS (SELECT 1 FROM challenge_participants WHERE challenge_id = completions.challenge_id AND user_id = auth.uid())
      OR EXISTS (SELECT 1 FROM challenges WHERE id = completions.challenge_id AND is_public = TRUE)
    ));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can create own completions" ON completions FOR INSERT WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can update own completions" ON completions FOR UPDATE USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============================================
-- REALTIME
-- ============================================
ALTER PUBLICATION supabase_realtime ADD TABLE challenges;
ALTER PUBLICATION supabase_realtime ADD TABLE challenge_participants;
ALTER PUBLICATION supabase_realtime ADD TABLE completions;
ALTER PUBLICATION supabase_realtime ADD TABLE groups;
ALTER PUBLICATION supabase_realtime ADD TABLE group_members;

-- ============================================
-- CREATE PROFILE ON SIGNUP (Function + Trigger)
-- ============================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, phone_number)
  VALUES (NEW.id, NEW.phone);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created') THEN
    CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW EXECUTE FUNCTION handle_new_user();
  END IF;
END $$;
