-- Fix existing profiles with null or invalid credential_type values
-- Run this in your Supabase SQL Editor

-- First, let's see what we're dealing with
SELECT 
    id, 
    clerk_id, 
    first_name, 
    last_name, 
    credential_type,
    created_at
FROM profiles 
WHERE credential_type IS NULL 
   OR credential_type = ''
   OR credential_type NOT IN ('CPA', 'EA', 'CTEC', 'Student', 'Tax Lawyer (JD)', 'PTIN Only', 'Other');

-- Update profiles with null credential_type to 'Other'
UPDATE profiles 
SET credential_type = 'Other'
WHERE credential_type IS NULL 
   OR credential_type = '';

-- Update profiles with invalid credential_type values to 'Other'
UPDATE profiles 
SET credential_type = 'Other'
WHERE credential_type NOT IN ('CPA', 'EA', 'CTEC', 'Student', 'Tax Lawyer (JD)', 'PTIN Only', 'Other');

-- Verify the fix
SELECT 
    id, 
    clerk_id, 
    first_name, 
    last_name, 
    credential_type,
    created_at
FROM profiles 
WHERE credential_type IS NULL 
   OR credential_type = ''
   OR credential_type NOT IN ('CPA', 'EA', 'CTEC', 'Student', 'Tax Lawyer (JD)', 'PTIN Only', 'Other');
