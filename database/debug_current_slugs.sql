-- Debug Current Profile Slugs
-- Run this first to see what we're working with

-- Check all profiles and their current slug status
SELECT 
  id, 
  first_name, 
  last_name, 
  slug,
  CASE 
    WHEN slug IS NULL THEN 'NULL'
    WHEN slug = '' THEN 'EMPTY'
    WHEN slug NOT SIMILAR TO '[a-z0-9-]+' THEN 'MALFORMED'
    ELSE 'VALID'
  END as slug_status,
  visibility_state,
  is_listed,
  created_at
FROM profiles 
ORDER BY created_at DESC;

-- Count profiles by slug status
SELECT 
  CASE 
    WHEN slug IS NULL THEN 'NULL'
    WHEN slug = '' THEN 'EMPTY'
    WHEN slug NOT SIMILAR TO '[a-z0-9-]+' THEN 'MALFORMED'
    ELSE 'VALID'
  END as slug_status,
  COUNT(*) as count
FROM profiles 
GROUP BY slug_status;

-- Show profiles with malformed slugs (like the one causing issues)
SELECT 
  id, 
  first_name, 
  last_name, 
  slug,
  visibility_state,
  is_listed
FROM profiles 
WHERE slug NOT SIMILAR TO '[a-z0-9-]+' OR slug LIKE '%-%' AND slug NOT SIMILAR TO '[a-z0-9-]+';

-- Show ALL profiles to see the complete picture
SELECT 
  id, 
  first_name, 
  last_name, 
  slug,
  visibility_state,
  is_listed,
  created_at
FROM profiles 
ORDER BY created_at DESC;
