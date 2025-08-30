-- Fix existing profiles with null slugs
-- Run this in your Supabase SQL Editor to fix the slug issue

-- Update profiles with null slugs to have proper slugs
UPDATE profiles 
SET slug = CONCAT(
  LOWER(REGEXP_REPLACE(COALESCE(first_name, 'user'), '[^a-zA-Z0-9\s]', '', 'g')),
  '-',
  LOWER(REGEXP_REPLACE(COALESCE(last_name, ''), '[^a-zA-Z0-9\s]', '', 'g')),
  '-',
  SUBSTRING(clerk_id, 1, 8)
)
WHERE slug IS NULL 
AND (first_name IS NOT NULL OR last_name IS NOT NULL);

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

-- Verify the fix
SELECT 
  id,
  first_name,
  last_name,
  slug,
  clerk_id
FROM profiles 
WHERE slug IS NOT NULL
ORDER BY created_at DESC
LIMIT 10;

-- Check if any null slugs remain
SELECT COUNT(*) as remaining_null_slugs
FROM profiles 
WHERE slug IS NULL;
