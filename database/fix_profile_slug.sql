-- Fix profile slug after cleanup
-- Run this in your Supabase SQL Editor

-- First, let's see what we have
SELECT 
    id,
    first_name,
    last_name,
    slug,
    visibility_state,
    is_listed,
    is_deleted,
    clerk_user_id
FROM profiles;

-- Generate a proper slug for the remaining profile
UPDATE profiles 
SET 
    slug = LOWER(REPLACE(CONCAT(first_name, '-', last_name), ' ', '-')),
    visibility_state = 'verified',
    is_listed = true,
    is_deleted = false,
    deleted_at = NULL
WHERE clerk_user_id = 'user_31vbRPusrbzss2XTqCjveAMIkq8'
   OR (first_name = 'Koen' AND last_name = 'Van Duyse' AND credential_type = 'EA' AND headline = 'ddd');

-- Verify the update worked
SELECT 
    id,
    first_name,
    last_name,
    slug,
    visibility_state,
    is_listed,
    is_deleted,
    clerk_user_id
FROM profiles;

-- Also make sure any licenses are marked as verified
UPDATE licenses 
SET status = 'verified'
WHERE profile_id IN (
    SELECT id FROM profiles 
    WHERE clerk_user_id = 'user_31vbRPusrbzss2XTqCjveAMIkq8'
       OR (first_name = 'Koen' AND last_name = 'Van Duyse' AND credential_type = 'EA' AND headline = 'ddd')
);
