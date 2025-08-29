-- Debug Profile Issues
-- This script will help us understand what's happening with profiles and slugs

-- 1. Check all profiles and their current state
SELECT 
    id,
    first_name,
    last_name,
    slug,
    visibility_state,
    is_listed,
    is_deleted,
    created_at
FROM profiles
ORDER BY created_at DESC;

-- 2. Check specifically for profiles that should be searchable
SELECT 
    id,
    first_name,
    last_name,
    slug,
    visibility_state,
    is_listed,
    is_deleted
FROM profiles
WHERE visibility_state = 'verified' 
  AND is_listed = true
  AND is_deleted = false
ORDER BY created_at DESC;

-- 3. Check for profiles with NULL or empty slugs
SELECT 
    id,
    first_name,
    last_name,
    slug,
    visibility_state,
    is_listed
FROM profiles
WHERE slug IS NULL OR slug = '';

-- 4. Check if there are any profiles with the specific slug we're looking for
SELECT 
    id,
    first_name,
    last_name,
    slug,
    visibility_state,
    is_listed
FROM profiles
WHERE slug = 'jen-dudley';

-- 5. Check for profiles with similar names
SELECT 
    id,
    first_name,
    last_name,
    slug,
    visibility_state,
    is_listed
FROM profiles
WHERE LOWER(CONCAT(first_name, ' ', last_name)) LIKE '%jen%' 
   OR LOWER(CONCAT(first_name, ' ', last_name)) LIKE '%dudley%';
