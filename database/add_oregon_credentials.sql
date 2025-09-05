-- Add Oregon Tax Professional Credential Types
-- Oregon Board of Tax Practitioners (OBTP) has two license levels:
-- 1. Tax Preparer - basic level
-- 2. Tax Consultant - advanced level before EA

-- Update the credential_type constraint to include Oregon credentials
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

-- Add the new constraint with Oregon credential types
ALTER TABLE profiles 
ADD CONSTRAINT profiles_credential_type_check 
CHECK (credential_type IN (
    'CPA', 
    'EA', 
    'CTEC', 
    'OR_Tax_Preparer',
    'OR_Tax_Consultant',
    'Student', 
    'Tax Lawyer (JD)', 
    'PTIN Only', 
    'Other'
));

-- Verify the changes
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'profiles' 
AND column_name = 'credential_type';

-- Show the constraint details
SELECT 
    constraint_name,
    check_clause
FROM information_schema.check_constraints 
WHERE constraint_schema = 'public'
AND constraint_name = 'profiles_credential_type_check';
