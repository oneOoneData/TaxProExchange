-- Complete slug fix - run this entire script in your Supabase SQL Editor
-- This will fix all existing slugs and prevent future null slug issues

-- Step 1: Check current state
SELECT '=== CURRENT STATE ===' as info;
SELECT 
  COUNT(*) as total_profiles,
  COUNT(CASE WHEN slug IS NULL THEN 1 END) as null_slugs,
  COUNT(CASE WHEN slug ~ '^[a-z0-9-]+$' THEN 1 END) as valid_slugs,
  COUNT(CASE WHEN slug !~ '^[a-z0-9-]+$' THEN 1 END) as invalid_slugs
FROM profiles;

-- Step 2: Show problematic profiles
SELECT '=== PROBLEMATIC PROFILES ===' as info;
SELECT 
  id,
  first_name,
  last_name,
  slug,
  clerk_id,
  created_at
FROM profiles 
WHERE slug !~ '^[a-z0-9-]+$' OR slug IS NULL OR slug = ''
ORDER BY created_at DESC 
LIMIT 10;

-- Step 3: Fix all existing slugs
SELECT '=== FIXING SLUGS ===' as info;

-- Fix profiles with names
UPDATE profiles 
SET slug = CONCAT(
  LOWER(REGEXP_REPLACE(COALESCE(first_name, 'user'), '[^a-zA-Z0-9\s]', '', 'g')),
  '-',
  LOWER(REGEXP_REPLACE(COALESCE(last_name, ''), '[^a-zA-Z0-9\s]', '', 'g')),
  '-',
  SUBSTRING(clerk_id, 1, 8)
)
WHERE slug IS NULL OR slug = '' OR slug !~ '^[a-z0-9-]+$'
AND (first_name IS NOT NULL AND first_name != '')
AND (last_name IS NOT NULL AND last_name != '');

-- Fix profiles with only first name
UPDATE profiles
SET slug = CONCAT(
  LOWER(REGEXP_REPLACE(COALESCE(first_name, 'user'), '[^a-zA-Z0-9\s]', '', 'g')),
  '-',
  SUBSTRING(clerk_id, 1, 8)
)
WHERE slug IS NULL OR slug = '' OR slug !~ '^[a-z0-9-]+$'
AND (first_name IS NOT NULL AND first_name != '')
AND (last_name IS NULL OR last_name = '');

-- Fix profiles with only last name
UPDATE profiles
SET slug = CONCAT(
  LOWER(REGEXP_REPLACE(COALESCE(last_name, 'user'), '[^a-zA-Z0-9\s]', '', 'g')),
  '-',
  SUBSTRING(clerk_id, 1, 8)
)
WHERE slug IS NULL OR slug = '' OR slug !~ '^[a-z0-9-]+$'
AND (first_name IS NULL OR first_name = '')
AND (last_name IS NOT NULL AND last_name != '');

-- Fix profiles with no names
UPDATE profiles
SET slug = CONCAT('user-', SUBSTRING(clerk_id, 1, 8))
WHERE slug IS NULL OR slug = '' OR slug !~ '^[a-z0-9-]+$'
AND (first_name IS NULL OR first_name = '')
AND (last_name IS NULL OR last_name = '');

-- Final cleanup for any remaining invalid slugs
UPDATE profiles
SET slug = CONCAT('profile-', SUBSTRING(clerk_id, 1, 8))
WHERE slug IS NULL OR slug = '' OR slug !~ '^[a-z0-9-]+$';

-- Step 4: Verify all slugs are now valid
SELECT '=== VERIFICATION ===' as info;
SELECT 
  COUNT(*) as total_profiles,
  COUNT(CASE WHEN slug IS NULL THEN 1 END) as null_slugs,
  COUNT(CASE WHEN slug ~ '^[a-z0-9-]+$' THEN 1 END) as valid_slugs,
  COUNT(CASE WHEN slug !~ '^[a-z0-9-]+$' THEN 1 END) as invalid_slugs
FROM profiles;

-- Step 5: Show fixed profiles
SELECT '=== FIXED PROFILES ===' as info;
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

-- Step 6: Add database constraints to prevent future issues
SELECT '=== ADDING CONSTRAINTS ===' as info;

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
    RAISE NOTICE 'Added unique constraint on slug';
  ELSE
    RAISE NOTICE 'Unique constraint on slug already exists';
  END IF;
END $$;

-- Add format check constraint
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'profiles_slug_format_check'
  ) THEN
    ALTER TABLE profiles ADD CONSTRAINT profiles_slug_format_check 
    CHECK (slug ~ '^[a-z0-9-]+$');
    RAISE NOTICE 'Added format check constraint on slug';
  ELSE
    RAISE NOTICE 'Format check constraint on slug already exists';
  END IF;
END $$;

-- Step 7: Create trigger function to auto-generate slugs for new profiles
SELECT '=== CREATING TRIGGER ===' as info;

CREATE OR REPLACE FUNCTION generate_profile_slug()
RETURNS TRIGGER AS $$
BEGIN
  -- Only generate slug if it's not provided
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    NEW.slug := CONCAT(
      LOWER(REGEXP_REPLACE(COALESCE(NEW.first_name, 'user'), '[^a-zA-Z0-9\s]', '', 'g')),
      '-',
      LOWER(REGEXP_REPLACE(COALESCE(NEW.last_name, ''), '[^a-zA-Z0-9\s]', '', 'g')),
      '-',
      SUBSTRING(NEW.clerk_id, 1, 8)
    );
  END IF;
  
  -- Ensure slug is lowercase and clean
  NEW.slug := LOWER(REGEXP_REPLACE(NEW.slug, '[^a-z0-9\s-]', '', 'g'));
  NEW.slug := REGEXP_REPLACE(NEW.slug, '\s+', '-', 'g');
  NEW.slug := REGEXP_REPLACE(NEW.slug, '-+', '-', 'g');
  NEW.slug := TRIM(BOTH '-' FROM NEW.slug);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-generate slugs
DROP TRIGGER IF EXISTS auto_generate_slug ON profiles;
CREATE TRIGGER auto_generate_slug
  BEFORE INSERT OR UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION generate_profile_slug();

-- Step 8: Final verification
SELECT '=== FINAL VERIFICATION ===' as info;
SELECT 
  COUNT(*) as total_profiles,
  COUNT(CASE WHEN slug IS NULL THEN 1 END) as null_slugs,
  COUNT(CASE WHEN slug ~ '^[a-z0-9-]+$' THEN 1 END) as valid_slugs,
  COUNT(CASE WHEN slug !~ '^[a-z0-9-]+$' THEN 1 END) as invalid_slugs
FROM profiles;

-- Show final sample
SELECT '=== FINAL SAMPLE ===' as info;
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

SELECT '=== SLUG FIX COMPLETE ===' as info;
