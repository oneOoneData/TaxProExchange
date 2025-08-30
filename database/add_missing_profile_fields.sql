-- Add missing profile fields that the frontend expects
-- Run this in your Supabase SQL Editor

-- Add credential_type field to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS credential_type TEXT DEFAULT 'Other';

-- Add headline field to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS headline TEXT;

-- Add bio field to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS bio TEXT;

-- Add website_url field to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS website_url TEXT;

-- Add linkedin_url field to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS linkedin_url TEXT;

-- Add accepting_work field to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS accepting_work BOOLEAN DEFAULT true;

-- Add public_contact field to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS public_contact BOOLEAN DEFAULT false;

-- Add works_multistate field to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS works_multistate BOOLEAN DEFAULT false;

-- Add works_international field to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS works_international BOOLEAN DEFAULT false;

-- Add countries field to profiles table (as JSONB array)
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS countries TEXT[] DEFAULT '{}';

-- Add specializations field to profiles table (as JSONB array)
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS specializations TEXT[] DEFAULT '{}';

-- Add states field to profiles table (as JSONB array)
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS states TEXT[] DEFAULT '{}';

-- Add software field to profiles table (as JSONB array)
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS software TEXT[] DEFAULT '{}';

-- Add other_software field to profiles table (as JSONB array)
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS other_software TEXT[] DEFAULT '{}';

-- Add legal acceptance fields if they don't exist
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS tos_version TEXT;

ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS tos_accepted_at TIMESTAMPTZ;

ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS privacy_version TEXT;

ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS privacy_accepted_at TIMESTAMPTZ;

-- Update the index to use the new credential_type field
CREATE INDEX IF NOT EXISTS idx_profiles_credential_type ON profiles(credential_type);

-- Add constraint for credential_type values (drop first if exists)
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'profiles_credential_type_check' 
        AND table_name = 'profiles'
    ) THEN
        ALTER TABLE profiles DROP CONSTRAINT profiles_credential_type_check;
    END IF;
END $$;

ALTER TABLE profiles 
ADD CONSTRAINT profiles_credential_type_check 
CHECK (credential_type IN ('CPA', 'EA', 'CTEC', 'Tax Lawyer (JD)', 'PTIN Only', 'Other'));

-- Update existing profiles to have default values
UPDATE profiles 
SET 
  credential_type = COALESCE(credential_type, 'Other'),
  accepting_work = COALESCE(accepting_work, true),
  public_contact = COALESCE(public_contact, false),
  works_multistate = COALESCE(works_multistate, false),
  works_international = COALESCE(works_international, false),
  countries = COALESCE(countries, '{}'),
  specializations = COALESCE(specializations, '{}'),
  states = COALESCE(states, '{}'),
  software = COALESCE(software, '{}'),
  other_software = COALESCE(other_software, '{}')
WHERE credential_type IS NULL;

-- Verify the changes
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default
FROM information_schema.columns 
WHERE table_name = 'profiles' 
ORDER BY ordinal_position;
