-- Fix slug uniqueness issues - handles existing constraints
-- Run this in your Supabase SQL Editor

-- Step 1: Check current state and constraints
SELECT '=== CURRENT STATE ===' as info;
SELECT 
  COUNT(*) as total_profiles,
  COUNT(CASE WHEN slug IS NULL THEN 1 END) as null_slugs,
  COUNT(CASE WHEN slug ~ '^[a-z0-9-]+$' THEN 1 END) as valid_slugs,
  COUNT(CASE WHEN slug !~ '^[a-z0-9-]+$' THEN 1 END) as invalid_slugs
FROM profiles;

-- Show existing constraints
SELECT '=== EXISTING CONSTRAINTS ===' as info;
SELECT 
  conname,
  contype,
  pg_get_constraintdef(oid) as definition
FROM pg_constraint 
WHERE conrelid = 'profiles'::regclass;

-- Step 2: Show duplicate slugs
SELECT '=== DUPLICATE SLUGS ===' as info;
SELECT 
  slug,
  COUNT(*) as count,
  array_agg(id) as profile_ids
FROM profiles 
WHERE slug IS NOT NULL
GROUP BY slug 
HAVING COUNT(*) > 1
ORDER BY count DESC;

-- Step 3: Drop existing constraints to avoid conflicts
SELECT '=== DROPPING CONSTRAINTS ===' as info;

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
  
  -- Drop unique constraint if it exists (handle both possible names)
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'unique_profile_slug'
  ) THEN
    ALTER TABLE profiles DROP CONSTRAINT unique_profile_slug;
    RAISE NOTICE 'Dropped existing unique constraint unique_profile_slug';
  END IF;
  
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'profiles_slug_key'
  ) THEN
    ALTER TABLE profiles DROP CONSTRAINT profiles_slug_key;
    RAISE NOTICE 'Dropped existing unique constraint profiles_slug_key';
  END IF;
END $$;

-- Step 4: Fix duplicate slugs by adding unique identifiers
SELECT '=== FIXING DUPLICATE SLUGS ===' as info;

-- Create a temporary table to track which slugs we've used
CREATE TEMP TABLE used_slugs AS
SELECT DISTINCT slug FROM profiles WHERE slug IS NOT NULL;

-- Update profiles with duplicate slugs to have unique ones
UPDATE profiles 
SET slug = CONCAT(
  slug,
  '-',
  SUBSTRING(clerk_id, 1, 8)
)
WHERE id IN (
  SELECT p.id
  FROM profiles p
  INNER JOIN (
    SELECT slug, COUNT(*) as count
    FROM profiles 
    WHERE slug IS NOT NULL
    GROUP BY slug 
    HAVING COUNT(*) > 1
  ) dupes ON p.slug = dupes.slug
  WHERE p.id NOT IN (
    SELECT (array_agg(id ORDER BY created_at ASC))[1]
    FROM profiles 
    GROUP BY slug
  )
);

-- Step 5: Regenerate any remaining invalid slugs
SELECT '=== REGENERATING INVALID SLUGS ===' as info;

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
END
WHERE slug IS NULL OR slug = '' OR slug !~ '^[a-z0-9-]+$';

-- Step 6: Final cleanup and formatting
SELECT '=== FINAL CLEANUP ===' as info;

-- Ensure all slugs are properly formatted
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

-- Step 7: Verify all slugs are now valid and unique
SELECT '=== VERIFICATION ===' as info;
SELECT 
  COUNT(*) as total_profiles,
  COUNT(CASE WHEN slug IS NULL THEN 1 END) as null_slugs,
  COUNT(CASE WHEN slug ~ '^[a-z0-9-]+$' THEN 1 END) as valid_slugs,
  COUNT(CASE WHEN slug !~ '^[a-z0-9-]+$' THEN 1 END) as invalid_slugs
FROM profiles;

-- Check for any remaining duplicates
SELECT '=== CHECKING FOR DUPLICATES ===' as info;
SELECT 
  slug,
  COUNT(*) as count
FROM profiles 
WHERE slug IS NOT NULL
GROUP BY slug 
HAVING COUNT(*) > 1;

-- Step 8: Show final results
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

-- Step 9: Now safely add constraints
SELECT '=== ADDING CONSTRAINTS ===' as info;

-- Make slug NOT NULL
ALTER TABLE profiles 
ALTER COLUMN slug SET NOT NULL;

-- Add unique constraint with a clear name
ALTER TABLE profiles ADD CONSTRAINT profiles_slug_unique UNIQUE (slug);

-- Add format check constraint
ALTER TABLE profiles ADD CONSTRAINT profiles_slug_format_check 
CHECK (slug ~ '^[a-z0-9-]+$');

-- Step 10: Create trigger for future profiles
SELECT '=== CREATING TRIGGER ===' as info;

CREATE OR REPLACE FUNCTION generate_profile_slug()
RETURNS TRIGGER AS $$
DECLARE
  base_slug TEXT;
  final_slug TEXT;
  counter INTEGER := 1;
BEGIN
  -- Only generate slug if it's not provided
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    -- Generate base slug
    base_slug := CONCAT(
      LOWER(REGEXP_REPLACE(COALESCE(NEW.first_name, 'user'), '[^a-zA-Z0-9\s]', '', 'g')),
      '-',
      LOWER(REGEXP_REPLACE(COALESCE(NEW.last_name, ''), '[^a-zA-Z0-9\s]', '', 'g')),
      '-',
      SUBSTRING(NEW.clerk_id, 1, 8)
    );
    
    -- Ensure uniqueness by adding counter if needed
    final_slug := base_slug;
    WHILE EXISTS (SELECT 1 FROM profiles WHERE slug = final_slug AND id != COALESCE(NEW.id, 0)) LOOP
      final_slug := base_slug || '-' || counter;
      counter := counter + 1;
    END LOOP;
    
    NEW.slug := final_slug;
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

-- Step 11: Final verification
SELECT '=== FINAL VERIFICATION ===' as info;
SELECT 
  COUNT(*) as total_profiles,
  COUNT(CASE WHEN slug IS NULL THEN 1 END) as null_slugs,
  COUNT(CASE WHEN slug ~ '^[a-z0-9-]+$' THEN 1 END) as valid_slugs,
  COUNT(CASE WHEN slug !~ '^[a-z0-9-]+$' THEN 1 END) as invalid_slugs
FROM profiles;

-- Clean up temp table
DROP TABLE used_slugs;

SELECT '=== SLUG FIX COMPLETE ===' as info;
