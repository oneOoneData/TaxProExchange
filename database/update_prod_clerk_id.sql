-- Update Admin Clerk ID for Production
-- Run this after getting your production Clerk ID

-- 1. First, see your current admin user
SELECT 
    first_name,
    last_name,
    public_email,
    clerk_id,
    is_admin
FROM profiles 
WHERE is_admin = true;

-- 2. Update your Clerk ID for production (replace 'your-prod-clerk-id' with actual ID)
-- Get your production Clerk ID from: window.Clerk?.user?.id in production browser console

UPDATE profiles 
SET clerk_id = 'your-prod-clerk-id-here',
    clerk_user_id = 'your-prod-clerk-id-here'
WHERE public_email = 'koen@cardifftax.com' 
  AND is_admin = true;

-- 3. Verify the update
SELECT 
    first_name,
    last_name,
    public_email,
    clerk_id,
    is_admin
FROM profiles 
WHERE public_email = 'koen@cardifftax.com';
