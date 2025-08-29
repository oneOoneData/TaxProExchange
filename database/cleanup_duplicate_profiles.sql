-- Clean up duplicate profiles - keep only the one linked to specific Clerk user ID
-- Run this in your Supabase SQL Editor
-- WARNING: This will permanently delete profiles!

-- First, let's see what we're about to delete
-- We need to find the profile that belongs to your Clerk user ID
SELECT 
    id,
    first_name,
    last_name,
    credential_type,
    headline,
    created_at,
    'KEEP' as action
FROM profiles 
WHERE clerk_user_id = 'user_31vbRPusrbzss2XTqCjveAMIkq8'
   OR (first_name = 'Koen' AND last_name = 'Van Duyse' AND credential_type = 'EA' AND headline = 'ddd')

UNION ALL

SELECT 
    id,
    first_name,
    last_name,
    credential_type,
    headline,
    created_at,
    'DELETE' as action
FROM profiles 
WHERE (clerk_user_id != 'user_31vbRPusrbzss2XTqCjveAMIkq8' OR clerk_user_id IS NULL)
   AND NOT (first_name = 'Koen' AND last_name = 'Van Duyse' AND credential_type = 'EA' AND headline = 'ddd');

-- Now delete all profiles except the one we want to keep
DELETE FROM profiles 
WHERE (clerk_user_id != 'user_31vbRPusrbzss2XTqCjveAMIkq8' OR clerk_user_id IS NULL)
   AND NOT (first_name = 'Koen' AND last_name = 'Van Duyse' AND credential_type = 'EA' AND headline = 'ddd');

-- Verify only the target profile remains
SELECT 
    id,
    first_name,
    last_name,
    credential_type,
    headline,
    created_at,
    'REMAINING' as status
FROM profiles;

-- Add the clerk_user_id to the remaining profile
UPDATE profiles 
SET clerk_user_id = 'user_31vbRPusrbzss2XTqCjveAMIkq8'
WHERE clerk_user_id IS NULL OR clerk_user_id != 'user_31vbRPusrbzss2XTqCjveAMIkq8';

-- Create index for future Clerk user lookups
CREATE INDEX IF NOT EXISTS idx_profiles_clerk_user_id ON profiles(clerk_user_id);
