-- Add opportunities field to profiles table
-- Safe for repeat execution

-- Add the opportunities column
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS opportunities TEXT NULL;

-- Add a comment to describe the field
COMMENT ON COLUMN profiles.opportunities IS 'What opportunities the user is open for and what expertise they are hoping to gain';

-- Verification message
DO $$
BEGIN
    RAISE NOTICE 'Opportunities field added successfully to profiles table!';
    RAISE NOTICE 'Users can now specify what opportunities they are open for and what expertise they want to gain.';
END $$;
