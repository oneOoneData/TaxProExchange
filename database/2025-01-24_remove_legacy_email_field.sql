-- Remove legacy email field from profiles table
-- This field was replaced by public_email and is no longer used

-- Drop the legacy email column
ALTER TABLE profiles DROP COLUMN IF EXISTS email;

-- Add comment to document the change
COMMENT ON TABLE profiles IS 'Profiles table - uses public_email field for email addresses';
