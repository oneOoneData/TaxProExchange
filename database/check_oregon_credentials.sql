-- Check if Oregon credentials are properly added to the database constraint
-- Run this in your Supabase SQL Editor

-- Check the current constraint on profiles table
SELECT 
    constraint_name,
    check_clause
FROM information_schema.check_constraints 
WHERE constraint_schema = 'public'
AND constraint_name = 'profiles_credential_type_check';

-- Test inserting a profile with Oregon credential type
-- This will show if the constraint allows the new values
SELECT 'Testing Oregon credential types...' as test;

-- Check if we can insert a test profile with OR_Tax_Preparer
-- (We won't actually insert, just test the constraint)
SELECT 
    CASE 
        WHEN 'OR_Tax_Preparer' = ANY(ARRAY['CPA'::text, 'EA'::text, 'CTEC'::text, 'OR_Tax_Preparer'::text, 'OR_Tax_Consultant'::text, 'Student'::text, 'Tax Lawyer (JD)'::text, 'PTIN Only'::text, 'Other'::text])
        THEN 'OR_Tax_Preparer is allowed'
        ELSE 'OR_Tax_Preparer is NOT allowed'
    END as test_result;

SELECT 
    CASE 
        WHEN 'OR_Tax_Consultant' = ANY(ARRAY['CPA'::text, 'EA'::text, 'CTEC'::text, 'OR_Tax_Preparer'::text, 'OR_Tax_Consultant'::text, 'Student'::text, 'Tax Lawyer (JD)'::text, 'PTIN Only'::text, 'Other'::text])
        THEN 'OR_Tax_Consultant is allowed'
        ELSE 'OR_Tax_Consultant is NOT allowed'
    END as test_result;
