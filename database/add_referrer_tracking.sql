-- Add referrer tracking to profiles table
-- Run this in your Supabase SQL Editor

-- Add referrer_profile_id column to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS referrer_profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL;

-- Add index for referrer lookups
CREATE INDEX IF NOT EXISTS idx_profiles_referrer ON profiles(referrer_profile_id);

-- Add index for slug lookups (if not already exists)
CREATE INDEX IF NOT EXISTS idx_profiles_slug ON profiles(slug) WHERE slug IS NOT NULL;

-- Verify the changes
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'profiles' 
AND column_name = 'referrer_profile_id';

-- Show the new indexes
SELECT 
    indexname, 
    indexdef
FROM pg_indexes 
WHERE tablename = 'profiles' 
AND indexname IN ('idx_profiles_referrer', 'idx_profiles_slug');
