-- Fix schema to support email authentication
-- Apply this in Supabase SQL Editor

-- 1. Make phone_number nullable and remove UNIQUE constraint
ALTER TABLE profiles
  ALTER COLUMN phone_number DROP NOT NULL,
  DROP CONSTRAINT IF EXISTS profiles_phone_number_key;

-- 2. Add email column (optional, for better data modeling)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email TEXT;

-- 3. Add constraint: either email or phone must be provided
ALTER TABLE profiles ADD CONSTRAINT email_or_phone_required
  CHECK (email IS NOT NULL OR phone_number IS NOT NULL);

-- 4. Create index on email
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email) WHERE email IS NOT NULL;

-- 5. Update the auto-profile creation trigger to handle both email and phone
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, phone_number, email)
  VALUES (
    NEW.id,
    NEW.phone,
    NEW.email
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Note: Trigger already exists from migration 001, this just updates the function
