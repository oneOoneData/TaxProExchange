-- Fix Profile Slugs
-- This script populates missing slug fields for all profiles

-- First, let's see what profiles exist and their current slug status
SELECT 
    id,
    first_name,
    last_name,
    slug,
    visibility_state,
    is_listed,
    is_deleted
FROM profiles
ORDER BY created_at DESC;

-- Update all profiles to have proper slugs
UPDATE profiles
SET 
    slug = LOWER(REPLACE(CONCAT(first_name, '-', last_name), ' ', '-')),
    updated_at = NOW()
WHERE slug IS NULL OR slug = '';

-- Verify the update worked
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

-- Optional: Add a unique constraint to prevent duplicate slugs
-- (Uncomment if you want to enforce uniqueness)
-- ALTER TABLE profiles ADD CONSTRAINT unique_profile_slug UNIQUE (slug);
