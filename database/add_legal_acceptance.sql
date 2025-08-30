-- Add legal acceptance fields to profiles table
-- Run this in your Supabase SQL Editor

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS tos_version TEXT,
  ADD COLUMN IF NOT EXISTS tos_accepted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS privacy_version TEXT,
  ADD COLUMN IF NOT EXISTS privacy_accepted_at TIMESTAMPTZ;

-- Add indexes for efficient lookups
CREATE INDEX IF NOT EXISTS idx_profiles_tos_version ON profiles(tos_version);
CREATE INDEX IF NOT EXISTS idx_profiles_privacy_version ON profiles(privacy_version);

-- Add comments for documentation
COMMENT ON COLUMN profiles.tos_version IS 'Version of Terms of Use accepted by user';
COMMENT ON COLUMN profiles.tos_accepted_at IS 'Timestamp when Terms of Use were accepted';
COMMENT ON COLUMN profiles.privacy_version IS 'Version of Privacy Policy accepted by user';
COMMENT ON COLUMN profiles.privacy_accepted_at IS 'Timestamp when Privacy Policy was accepted';
