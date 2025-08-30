-- Fix slug issue at the root - comprehensive solution
-- Run this in your Supabase SQL Editor

-- Step 1: Check current table structure
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default
FROM information_schema.columns 
WHERE table_name = 'profiles' 
ORDER BY ordinal_position;

-- Step 2: Fix any existing null slugs
UPDATE profiles 
SET slug = CONCAT(
  LOWER(REGEXP_REPLACE(COALESCE(first_name, 'user'), '[^a-zA-Z0-9\s]', '', 'g')),
  '-',
  LOWER(REGEXP_REPLACE(COALESCE(last_name, ''), '[^a-zA-Z0-9\s]', '', 'g')),
  '-',
  SUBSTRING(clerk_id, 1, 8)
)
WHERE slug IS NULL;

-- Step 3: Ensure clerk_id field exists and is properly configured
-- If clerk_id doesn't exist, add it
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'clerk_id'
  ) THEN
    ALTER TABLE profiles ADD COLUMN clerk_id TEXT;
  END IF;
END $$;

-- Step 4: Make slug NOT NULL and add constraints
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

-- Add format check constraint
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

-- Step 5: Create a trigger function to auto-generate slugs
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

-- Step 6: Create trigger to auto-generate slugs
DROP TRIGGER IF EXISTS auto_generate_slug ON profiles;
CREATE TRIGGER auto_generate_slug
  BEFORE INSERT OR UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION generate_profile_slug();

-- Step 7: Verify the fix
SELECT 
  COUNT(*) as total_profiles,
  COUNT(CASE WHEN slug IS NULL THEN 1 END) as null_slugs,
  COUNT(CASE WHEN slug ~ '^[a-z0-9-]+$' THEN 1 END) as valid_slugs,
  COUNT(CASE WHEN clerk_id IS NOT NULL THEN 1 END) as profiles_with_clerk_id
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
