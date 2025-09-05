-- Fix duplicate slugs in profiles table
-- Run this in your Supabase SQL Editor

-- 1. First, let's see what we're dealing with
SELECT 'Before fix - duplicate slugs:' as info;
SELECT slug, COUNT(*) as count
FROM profiles 
WHERE slug IS NOT NULL
GROUP BY slug 
HAVING COUNT(*) > 1
ORDER BY count DESC;

-- 2. Fix duplicate slugs by adding a unique suffix to duplicates
-- Keep the oldest profile with the original slug, update others
WITH duplicate_slugs AS (
  SELECT slug, MIN(created_at) as first_created
  FROM profiles 
  WHERE slug IS NOT NULL
  GROUP BY slug 
  HAVING COUNT(*) > 1
),
profiles_to_update AS (
  SELECT p.id, p.slug, p.created_at,
         ROW_NUMBER() OVER (PARTITION BY p.slug ORDER BY p.created_at) as rn
  FROM profiles p
  INNER JOIN duplicate_slugs ds ON p.slug = ds.slug
  WHERE p.created_at > ds.first_created
)
UPDATE profiles 
SET slug = CONCAT(slug, '-', EXTRACT(EPOCH FROM created_at)::bigint)
FROM profiles_to_update ptu
WHERE profiles.id = ptu.id;

-- 3. Verify the fix
SELECT 'After fix - duplicate slugs:' as info;
SELECT slug, COUNT(*) as count
FROM profiles 
WHERE slug IS NOT NULL
GROUP BY slug 
HAVING COUNT(*) > 1
ORDER BY count DESC;

-- 4. Show updated profiles
SELECT 'Updated profiles with new slugs:' as info;
SELECT id, first_name, last_name, clerk_id, slug, created_at
FROM profiles 
WHERE slug LIKE 'new-user-user32%'
ORDER BY created_at;
