-- Add notified_verified_listed_at column to profiles table
-- Run this in your Supabase SQL Editor

-- Add the column to track when we've sent the verified + listed email
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS notified_verified_listed_at timestamptz NULL;

-- Add index for efficient lookups
CREATE INDEX IF NOT EXISTS idx_profiles_notified_verified_listed ON profiles(notified_verified_listed_at);

-- Verify the changes
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'profiles' 
AND column_name = 'notified_verified_listed_at';
