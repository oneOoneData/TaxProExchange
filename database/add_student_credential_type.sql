-- Add 'Student' as a valid credential type
-- This migration updates the credential_type constraint to include 'Student'

-- First, drop the existing constraint
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_credential_type_check;

-- Add the new constraint that includes 'Student'
ALTER TABLE profiles ADD CONSTRAINT profiles_credential_type_check
CHECK (credential_type IN ('CPA', 'EA', 'CTEC', 'Student', 'Tax Lawyer (JD)', 'PTIN Only', 'Other'));

-- Update the schema.sql file reference constraint as well
-- Note: This will be updated in the main schema file separately
