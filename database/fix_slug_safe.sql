-- Safe fix for slug issue - fix data first, then add constraints
-- Run this in your Supabase SQL Editor

-- Step 1: Check current table structure and data
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default
FROM information_schema.columns 
WHERE table_name = 'profiles' 
ORDER BY ordinal_position;

-- Step 2: Show current slug issues
SELECT 
  COUNT(*) as total_profiles,
  COUNT(CASE WHEN slug IS NULL THEN 1 END) as null_slugs,
  COUNT(CASE WHEN slug ~ '^[a-z0-9-]+$' THEN 1 END) as valid_slugs,
  COUNT(CASE WHEN slug !~ '^[a-z0-9-]+$' THEN 1 END) as invalid_slugs
FROM profiles;

-- Step 3: Show examples of invalid slugs
SELECT 
  id,
  first_name,
  last_name,
  slug,
  clerk_id
FROM profiles 
WHERE slug !~ '^[a-z0-9-]+$' OR slug IS NULL
ORDER BY created_at DESC 
LIMIT 10;

-- Step 4: Fix all existing slugs to be valid
UPDATE profiles 
SET slug = CONCAT(
  LOWER(REGEXP_REPLACE(COALESCE(first_name, 'user'), '[^a-zA-Z0-9\s]', '', 'g')),
  '-',
  LOWER(REGEXP_REPLACE(COALESCE(last_name, ''), '[^a-zA-Z0-9\s]', '', 'g')),
  '-',
  SUBSTRING(clerk_id, 1, 8)
)
WHERE slug IS NULL OR slug = '' OR slug !~ '^[a-z0-9-]+$';

-- Step 5: For profiles with no names, use a generic slug with ID
UPDATE profiles
SET slug = CONCAT('user-', SUBSTRING(clerk_id, 1, 8))
WHERE slug IS NULL OR slug = '' OR slug !~ '^[a-z0-9-]+$'
AND (first_name IS NULL OR first_name = '')
AND (last_name IS NULL OR last_name = '');

-- Step 6: Clean up any remaining invalid slugs by using clerk_id
UPDATE profiles
SET slug = CONCAT('profile-', SUBSTRING(clerk_id, 1, 8))
WHERE slug IS NULL OR slug = '' OR slug !~ '^[a-z0-9-]+$';

-- Step 7: Verify all slugs are now valid
SELECT 
  COUNT(*) as total_profiles,
  COUNT(CASE WHEN slug IS NULL THEN 1 END) as null_slugs,
  COUNT(CASE WHEN slug ~ '^[a-z0-9-]+$' THEN 1 END) as valid_slugs,
  COUNT(CASE WHEN slug !~ '^[a-z0-9-]+$' THEN 1 END) as invalid_slugs
FROM profiles;

-- Step 8: Show sample of fixed profiles
SELECT 
  id,
  first_name,
  last_name,
  slug,
  clerk_id,
  created_at
FROM profiles 
ORDER BY created_at DESC 
LIMIT 10;

-- Step 9: Now safely add constraints (only after data is clean)
-- Make slug NOT NULL
ALTER TABLE profiles 
ALTER COLUMN slug SET NOT NULL;

-- Add unique constraint if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'profiles_slug_key'
  ) THEN
    ALTER TABLE profiles ADD CONSTRAINT profiles_slug_key UNIQUE (slug);
  END IF;
END $$;

-- Add format check constraint (now safe since all data is valid)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'profiles_slug_format_check'
  ) THEN
    ALTER TABLE profiles ADD CONSTRAINT profiles_slug_format_check 
    CHECK (slug ~ '^[a-z0-9-]+$');
  END IF;
END $$;

-- Step 10: Final verification
SELECT 
  COUNT(*) as total_profiles,
  COUNT(CASE WHEN slug IS NULL THEN 1 END) as null_slugs,
  COUNT(CASE WHEN slug ~ '^[a-z0-9-]+$' THEN 1 END) as valid_slugs,
  COUNT(CASE WHEN slug !~ '^[a-z0-9-]+$' THEN 1 END) as invalid_slugs
FROM profiles;
