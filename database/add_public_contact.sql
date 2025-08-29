-- Add public_contact column to profiles table
-- This migration adds a boolean flag to control whether contact information is publicly visible

-- 1. Add public_contact column with default value false
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS public_contact BOOLEAN NOT NULL DEFAULT false;

-- 2. Create index for performance on public_contact queries
CREATE INDEX IF NOT EXISTS idx_profiles_public_contact ON profiles(public_contact);

-- 3. Add comment to document the column purpose
COMMENT ON COLUMN profiles.public_contact IS 'Controls whether contact information is visible to unauthenticated users. Defaults to false (private).';

-- 4. Update existing profiles to have explicit public_contact values
-- (This ensures all existing profiles default to private contact info)
UPDATE profiles SET public_contact = false WHERE public_contact IS NULL;

-- 5. Verify the migration
SELECT 
    'Migration completed successfully' as status,
    COUNT(*) as total_profiles,
    COUNT(CASE WHEN public_contact = true THEN 1 END) as public_contact_profiles,
    COUNT(CASE WHEN public_contact = false THEN 1 END) as private_contact_profiles
FROM profiles;
