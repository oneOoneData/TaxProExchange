-- Add 'Student' as a valid credential type - Complete Migration Script
-- Run this in your Supabase SQL Editor to add Student credential type support

-- 1. Update profiles table credential_type constraint
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_credential_type_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_credential_type_check
CHECK (credential_type IN ('CPA', 'EA', 'CTEC', 'Student', 'Tax Lawyer (JD)', 'PTIN Only', 'Other'));

-- 2. Update any existing profiles that might have invalid credential types (optional safety check)
-- This will set any invalid credential types to 'Other' as a fallback
UPDATE profiles 
SET credential_type = 'Other' 
WHERE credential_type NOT IN ('CPA', 'EA', 'CTEC', 'Student', 'Tax Lawyer (JD)', 'PTIN Only', 'Other');

-- 3. Verify the changes
DO $$
BEGIN
    RAISE NOTICE 'Student credential type migration completed successfully!';
    RAISE NOTICE 'Valid credential types now include: CPA, EA, CTEC, Student, Tax Lawyer (JD), PTIN Only, Other';
END $$;
