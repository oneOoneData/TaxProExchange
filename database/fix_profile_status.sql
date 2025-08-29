-- Fix profile status after cleanup
-- Run this in your Supabase SQL Editor

-- First, let's see the current status of the remaining profile
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

-- Update the remaining profile to be visible and searchable
UPDATE profiles 
SET 
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
