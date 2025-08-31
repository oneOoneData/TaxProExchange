-- Get Clerk IDs for Admin User Setup
-- Run this to see your current admin user's Clerk ID

SELECT 
    first_name,
    last_name,
    public_email,
    clerk_id,
    additional_clerk_ids,
    is_admin
FROM profiles 
WHERE is_admin = true;

-- To add your production Clerk ID to the additional_clerk_ids array:
-- 1. Get your production Clerk ID from browser console: window.Clerk?.user?.id
-- 2. Run this (replace 'your-prod-clerk-id' with actual ID):

-- UPDATE profiles 
-- SET additional_clerk_ids = COALESCE(additional_clerk_ids, '[]'::jsonb) || '"your-prod-clerk-id"'::jsonb
-- WHERE public_email = 'koen@cardifftax.com' 
--   AND is_admin = true;
