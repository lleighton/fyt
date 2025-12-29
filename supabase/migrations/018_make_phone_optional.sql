-- Make phone_number optional to support email-only auth
-- This allows users to sign up with either phone or email

-- Remove NOT NULL constraint from phone_number
ALTER TABLE profiles ALTER COLUMN phone_number DROP NOT NULL;

-- Add email column if it doesn't exist
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email TEXT;

-- Create index on email for lookups
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email) WHERE email IS NOT NULL;

-- Update the handle_new_user function to support both phone and email
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, phone_number, email)
  VALUES (NEW.id, NEW.phone, NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
