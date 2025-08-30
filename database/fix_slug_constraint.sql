-- Fix slug constraint issue - make slug NOT NULL and add default value
-- Run this in your Supabase SQL Editor

-- First, update any existing profiles with null slugs
UPDATE profiles 
SET slug = CONCAT(
  LOWER(REGEXP_REPLACE(COALESCE(first_name, 'user'), '[^a-zA-Z0-9\s]', '', 'g')),
  '-',
  LOWER(REGEXP_REPLACE(COALESCE(last_name, ''), '[^a-zA-Z0-9\s]', '', 'g')),
  '-',
  SUBSTRING(clerk_id, 1, 8)
)
WHERE slug IS NULL;

-- For profiles with no names, use a generic slug with ID
UPDATE profiles
SET slug = CONCAT('user-', SUBSTRING(clerk_id, 1, 8))
WHERE slug IS NULL
AND first_name IS NULL
AND last_name IS NULL;

-- Clean up any remaining null slugs by using clerk_id
UPDATE profiles
SET slug = CONCAT('profile-', SUBSTRING(clerk_id, 1, 8))
WHERE slug IS NULL;

-- Now alter the table to make slug NOT NULL
ALTER TABLE profiles 
ALTER COLUMN slug SET NOT NULL;

-- Add a check constraint to ensure slug format
ALTER TABLE profiles 
ADD CONSTRAINT profiles_slug_format_check 
CHECK (slug ~ '^[a-z0-9-]+$');

-- Verify the fix
SELECT 
  COUNT(*) as total_profiles,
  COUNT(CASE WHEN slug IS NULL THEN 1 END) as null_slugs,
  COUNT(CASE WHEN slug ~ '^[a-z0-9-]+$' THEN 1 END) as valid_slugs
FROM profiles;

-- Show sample of fixed slugs
SELECT 
  id,
  first_name,
  last_name,
  slug,
  clerk_id
FROM profiles 
ORDER BY created_at DESC 
LIMIT 10;
