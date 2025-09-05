-- Debug script to check for duplicate slugs in profiles table
-- Run this in your Supabase SQL Editor

-- 1. Check for duplicate slugs
SELECT 'Duplicate slugs found:' as info;
SELECT slug, COUNT(*) as count
FROM profiles 
WHERE slug IS NOT NULL
GROUP BY slug 
HAVING COUNT(*) > 1
ORDER BY count DESC;

-- 2. Show all profiles with the problematic slug
SELECT 'Profiles with slug "new-user-user32":' as info;
SELECT id, first_name, last_name, clerk_id, slug, created_at
FROM profiles 
WHERE slug = 'new-user-user32'
ORDER BY created_at;

-- 3. Show all profiles with "new-user" prefix
SELECT 'All profiles with "new-user" prefix:' as info;
SELECT id, first_name, last_name, clerk_id, slug, created_at
FROM profiles 
WHERE slug LIKE 'new-user%'
ORDER BY slug, created_at;

-- 4. Check if there are any profiles with NULL slugs
SELECT 'Profiles with NULL slugs:' as info;
SELECT COUNT(*) as null_slug_count
FROM profiles 
WHERE slug IS NULL;

-- 5. Show the constraint on the slug column
SELECT 'Slug constraint details:' as info;
SELECT 
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name = 'profiles' 
    AND kcu.column_name = 'slug';
