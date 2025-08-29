-- Fix Jen Dudley's Profile Slug
-- This script specifically fixes the profile that's causing the 404 error

-- First, let's see Jen Dudley's current profile
SELECT 
    id,
    first_name,
    last_name,
    slug,
    visibility_state,
    is_listed,
    is_deleted
FROM profiles
WHERE first_name = 'Jen' AND last_name = 'Dudley';

-- Update Jen Dudley's profile to have the correct slug
UPDATE profiles
SET 
    slug = 'jen-dudley',
    updated_at = NOW()
WHERE first_name = 'Jen' AND last_name = 'Dudley';

-- Verify the update worked
SELECT 
    id,
    first_name,
    last_name,
    slug,
    visibility_state,
    is_listed
FROM profiles
WHERE first_name = 'Jen' AND last_name = 'Dudley';

-- Also fix any other profiles with NULL slugs
UPDATE profiles
SET 
    slug = LOWER(REPLACE(CONCAT(first_name, '-', last_name), ' ', '-')),
    updated_at = NOW()
WHERE slug IS NULL OR slug = '';

-- Show all verified and listed profiles with their slugs
SELECT 
    id,
    first_name,
    last_name,
    slug,
    visibility_state,
    is_listed
FROM profiles
WHERE visibility_state = 'verified' AND is_listed = true
ORDER BY created_at DESC;
