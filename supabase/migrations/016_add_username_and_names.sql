-- Migration: Add username and name fields to profiles
-- Enables user discovery and more personal interactions

-- ============================================
-- ADD NEW COLUMNS TO PROFILES
-- ============================================

-- Username: unique identifier for search and @mentions
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS username TEXT UNIQUE;

-- First name: required for personal feel
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS first_name TEXT;

-- Last name: optional
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_name TEXT;

-- ============================================
-- CREATE INDEX FOR USERNAME SEARCH
-- ============================================
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username) WHERE username IS NOT NULL AND deleted = FALSE;

-- Case-insensitive search index
CREATE INDEX IF NOT EXISTS idx_profiles_username_lower ON profiles(LOWER(username)) WHERE username IS NOT NULL AND deleted = FALSE;

-- Index for name search
CREATE INDEX IF NOT EXISTS idx_profiles_first_name_lower ON profiles(LOWER(first_name)) WHERE first_name IS NOT NULL AND deleted = FALSE;

-- ============================================
-- FUNCTION: Generate unique username suggestion
-- ============================================
CREATE OR REPLACE FUNCTION generate_username_suggestion(p_first_name TEXT, p_last_name TEXT DEFAULT NULL)
RETURNS TEXT AS $$
DECLARE
  base_username TEXT;
  suggested_username TEXT;
  counter INT := 0;
BEGIN
  -- Create base username from first name (and optionally last initial)
  base_username := LOWER(REGEXP_REPLACE(COALESCE(p_first_name, 'user'), '[^a-zA-Z0-9]', '', 'g'));

  IF p_last_name IS NOT NULL AND LENGTH(p_last_name) > 0 THEN
    base_username := base_username || LOWER(SUBSTRING(p_last_name, 1, 1));
  END IF;

  -- Ensure minimum length
  IF LENGTH(base_username) < 3 THEN
    base_username := base_username || 'user';
  END IF;

  -- Try base username first
  suggested_username := base_username;

  -- Keep trying with incrementing numbers until we find a unique one
  WHILE EXISTS (SELECT 1 FROM profiles WHERE LOWER(username) = LOWER(suggested_username)) LOOP
    counter := counter + 1;
    suggested_username := base_username || counter::TEXT;
  END LOOP;

  RETURN suggested_username;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- FUNCTION: Validate username format
-- ============================================
CREATE OR REPLACE FUNCTION is_valid_username(p_username TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  -- Rules:
  -- 1. 3-20 characters
  -- 2. Only lowercase letters, numbers, underscores
  -- 3. Must start with a letter
  -- 4. No consecutive underscores
  -- 5. Cannot end with underscore
  RETURN p_username ~ '^[a-z][a-z0-9_]{1,18}[a-z0-9]$'
    AND p_username !~ '__';
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================
-- FUNCTION: Search users by username or name
-- ============================================
CREATE OR REPLACE FUNCTION search_users(
  p_query TEXT,
  p_limit INT DEFAULT 20,
  p_exclude_user_id UUID DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  username TEXT,
  first_name TEXT,
  last_name TEXT,
  display_name TEXT,
  avatar_url TEXT,
  match_type TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT ON (pr.id)
    pr.id,
    pr.username,
    pr.first_name,
    pr.last_name,
    pr.display_name,
    pr.avatar_url,
    CASE
      WHEN LOWER(pr.username) = LOWER(p_query) THEN 'exact_username'
      WHEN LOWER(pr.username) LIKE LOWER(p_query) || '%' THEN 'username_prefix'
      WHEN LOWER(pr.first_name) LIKE LOWER(p_query) || '%' THEN 'first_name'
      WHEN LOWER(pr.last_name) LIKE LOWER(p_query) || '%' THEN 'last_name'
      ELSE 'partial'
    END as match_type
  FROM profiles pr
  WHERE pr.deleted = FALSE
    AND pr.username IS NOT NULL
    AND (p_exclude_user_id IS NULL OR pr.id != p_exclude_user_id)
    AND (
      LOWER(pr.username) LIKE LOWER(p_query) || '%'
      OR LOWER(pr.first_name) LIKE LOWER(p_query) || '%'
      OR LOWER(pr.last_name) LIKE LOWER(p_query) || '%'
      OR LOWER(pr.display_name) LIKE '%' || LOWER(p_query) || '%'
    )
  ORDER BY pr.id,
    CASE
      WHEN LOWER(pr.username) = LOWER(p_query) THEN 0
      WHEN LOWER(pr.username) LIKE LOWER(p_query) || '%' THEN 1
      WHEN LOWER(pr.first_name) LIKE LOWER(p_query) || '%' THEN 2
      ELSE 3
    END,
    pr.username
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- FUNCTION: Check if username is available
-- ============================================
CREATE OR REPLACE FUNCTION is_username_available(p_username TEXT, p_current_user_id UUID DEFAULT NULL)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN NOT EXISTS (
    SELECT 1 FROM profiles
    WHERE LOWER(username) = LOWER(p_username)
    AND (p_current_user_id IS NULL OR id != p_current_user_id)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- UPDATE DISPLAY_NAME TRIGGER
-- Auto-compute display_name from first_name + last_name if not set
-- ============================================
CREATE OR REPLACE FUNCTION compute_display_name()
RETURNS TRIGGER AS $$
BEGIN
  -- Only auto-compute if display_name is null or empty and we have first_name
  IF (NEW.display_name IS NULL OR NEW.display_name = '') AND NEW.first_name IS NOT NULL THEN
    NEW.display_name := TRIM(COALESCE(NEW.first_name, '') || ' ' || COALESCE(NEW.last_name, ''));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS compute_display_name_trigger ON profiles;
CREATE TRIGGER compute_display_name_trigger
  BEFORE INSERT OR UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION compute_display_name();

-- ============================================
-- GRANT EXECUTE ON FUNCTIONS
-- ============================================
GRANT EXECUTE ON FUNCTION search_users(TEXT, INT, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION is_username_available(TEXT, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION generate_username_suggestion(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION is_valid_username(TEXT) TO authenticated;
