-- Fix Admin Clerk ID for Production Environment
-- This script helps identify and update admin user's Clerk ID for production

-- 1. First, let's see all admin users and their Clerk IDs
SELECT 
    id,
    first_name,
    last_name,
    public_email,
    clerk_id,
    clerk_user_id,
    is_admin,
    created_at
FROM profiles 
WHERE is_admin = true;

-- 2. Check if there are any profiles with different Clerk ID formats
SELECT 
    clerk_id,
    clerk_user_id,
    COUNT(*) as count
FROM profiles 
WHERE clerk_id IS NOT NULL OR clerk_user_id IS NOT NULL
GROUP BY clerk_id, clerk_user_id;

-- 3. SOLUTION: Add a new column to store multiple Clerk IDs for the same user
-- This allows one admin profile to work with both dev and prod Clerk IDs

-- Add a new column to store additional Clerk IDs (JSON array)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS additional_clerk_ids JSONB DEFAULT '[]';

-- 4. Update your admin user to include both dev and prod Clerk IDs
-- Replace the values with your actual Clerk IDs from both environments

-- First, get your current Clerk ID (dev)
-- SELECT clerk_id FROM profiles WHERE public_email = 'koen@cardifftax.com' AND is_admin = true;

-- Then update to include both IDs (replace with your actual IDs)
UPDATE profiles 
SET additional_clerk_ids = '["your-dev-clerk-id", "your-prod-clerk-id"]'::jsonb
WHERE public_email = 'koen@cardifftax.com' 
  AND is_admin = true;

-- 5. Verify the update worked
SELECT 
    first_name,
    last_name,
    public_email,
    clerk_id,
    additional_clerk_ids,
    is_admin
FROM profiles 
WHERE public_email = 'koen@cardifftax.com';

-- 6. Test query to check if a Clerk ID matches either the main clerk_id or additional_clerk_ids
-- Replace 'test-clerk-id' with an actual Clerk ID to test
SELECT 
    first_name,
    last_name,
    is_admin,
    clerk_id = 'test-clerk-id' OR additional_clerk_ids ? 'test-clerk-id' as is_matching_user
FROM profiles 
WHERE public_email = 'koen@cardifftax.com';
