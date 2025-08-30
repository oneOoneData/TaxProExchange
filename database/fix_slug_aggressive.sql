-- Aggressive slug fix - handles all edge cases
-- Run this in your Supabase SQL Editor

-- Step 1: Check current state
SELECT '=== CURRENT STATE ===' as info;
SELECT 
  COUNT(*) as total_profiles,
  COUNT(CASE WHEN slug IS NULL THEN 1 END) as null_slugs,
  COUNT(CASE WHEN slug ~ '^[a-z0-9-]+$' THEN 1 END) as valid_slugs,
  COUNT(CASE WHEN slug !~ '^[a-z0-9-]+$' THEN 1 END) as invalid_slugs
FROM profiles;

-- Step 2: Show ALL problematic slugs
SELECT '=== ALL PROBLEMATIC SLUGS ===' as info;
SELECT 
  id,
  first_name,
  last_name,
  slug,
  clerk_id,
  created_at
FROM profiles 
WHERE slug IS NULL OR slug = '' OR slug !~ '^[a-z0-9-]+$'
ORDER BY created_at DESC;

-- Step 3: Nuclear option - regenerate ALL slugs from scratch
SELECT '=== REGENERATING ALL SLUGS ===' as info;

-- First, drop any existing constraints that might interfere
DO $$ 
BEGIN
  -- Drop check constraint if it exists
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'profiles_slug_format_check'
  ) THEN
    ALTER TABLE profiles DROP CONSTRAINT profiles_slug_format_check;
    RAISE NOTICE 'Dropped existing format check constraint';
  END IF;
  
  -- Drop unique constraint if it exists
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'profiles_slug_key'
  ) THEN
    ALTER TABLE profiles DROP CONSTRAINT profiles_slug_key;
    RAISE NOTICE 'Dropped existing unique constraint';
  END IF;
END $$;

-- Now regenerate ALL slugs systematically
UPDATE profiles 
SET slug = CASE
  -- Profiles with both names
  WHEN first_name IS NOT NULL AND first_name != '' 
       AND last_name IS NOT NULL AND last_name != '' 
  THEN CONCAT(
    LOWER(REGEXP_REPLACE(first_name, '[^a-zA-Z0-9\s]', '', 'g')),
    '-',
    LOWER(REGEXP_REPLACE(last_name, '[^a-zA-Z0-9\s]', '', 'g')),
    '-',
    SUBSTRING(clerk_id, 1, 8)
  )
  
  -- Profiles with only first name
  WHEN first_name IS NOT NULL AND first_name != '' 
       AND (last_name IS NULL OR last_name = '')
  THEN CONCAT(
    LOWER(REGEXP_REPLACE(first_name, '[^a-zA-Z0-9\s]', '', 'g')),
    '-',
    SUBSTRING(clerk_id, 1, 8)
  )
  
  -- Profiles with only last name
  WHEN (first_name IS NULL OR first_name = '')
       AND last_name IS NOT NULL AND last_name != ''
  THEN CONCAT(
    LOWER(REGEXP_REPLACE(last_name, '[^a-zA-Z0-9\s]', '', 'g')),
    '-',
    SUBSTRING(clerk_id, 1, 8)
  )
  
  -- Profiles with no names at all
  ELSE CONCAT('user-', SUBSTRING(clerk_id, 1, 8))
END;

-- Step 4: Clean up any remaining edge cases
UPDATE profiles
SET slug = CONCAT('profile-', SUBSTRING(clerk_id, 1, 8))
WHERE slug IS NULL OR slug = '' OR slug !~ '^[a-z0-9-]+$';

-- Step 5: Final cleanup - ensure all slugs are properly formatted
UPDATE profiles
SET slug = LOWER(REGEXP_REPLACE(slug, '[^a-z0-9\s-]', '', 'g'))
WHERE slug !~ '^[a-z0-9-]+$';

UPDATE profiles
SET slug = REGEXP_REPLACE(slug, '\s+', '-', 'g')
WHERE slug LIKE '% %';

UPDATE profiles
SET slug = REGEXP_REPLACE(slug, '-+', '-', 'g')
WHERE slug LIKE '%-%-%';

UPDATE profiles
SET slug = TRIM(BOTH '-' FROM slug)
WHERE slug LIKE '-%' OR slug LIKE '%-';

-- Step 6: Verify all slugs are now valid
SELECT '=== VERIFICATION ===' as info;
SELECT 
  COUNT(*) as total_profiles,
  COUNT(CASE WHEN slug IS NULL THEN 1 END) as null_slugs,
  COUNT(CASE WHEN slug ~ '^[a-z0-9-]+$' THEN 1 END) as valid_slugs,
  COUNT(CASE WHEN slug !~ '^[a-z0-9-]+$' THEN 1 END) as invalid_slugs
FROM profiles;

-- Step 7: Show final results
SELECT '=== FINAL RESULTS ===' as info;
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

-- Step 8: Now safely add constraints
SELECT '=== ADDING CONSTRAINTS ===' as info;

-- Make slug NOT NULL
ALTER TABLE profiles 
ALTER COLUMN slug SET NOT NULL;

-- Add unique constraint
ALTER TABLE profiles ADD CONSTRAINT profiles_slug_key UNIQUE (slug);

-- Add format check constraint (should work now)
ALTER TABLE profiles ADD CONSTRAINT profiles_slug_format_check 
CHECK (slug ~ '^[a-z0-9-]+$');

-- Step 9: Create trigger for future profiles
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

-- Step 10: Final verification
SELECT '=== FINAL VERIFICATION ===' as info;
SELECT 
  COUNT(*) as total_profiles,
  COUNT(CASE WHEN slug IS NULL THEN 1 END) as null_slugs,
  COUNT(CASE WHEN slug ~ '^[a-z0-9-]+$' THEN 1 END) as valid_slugs,
  COUNT(CASE WHEN slug !~ '^[a-z0-9-]+$' THEN 1 END) as invalid_slugs
FROM profiles;

SELECT '=== SLUG FIX COMPLETE ===' as info;
