-- Test script to simulate the connection flow
-- Run this in your Supabase SQL Editor

-- 1. First, let's see what profiles we have
SELECT 'Available profiles for testing:' as info;
SELECT id, first_name, last_name, clerk_id
FROM profiles 
WHERE clerk_id IS NOT NULL
ORDER BY created_at DESC
LIMIT 10;

-- 2. Let's create a test connection between two profiles
-- Replace these UUIDs with actual profile IDs from step 1
-- This simulates what happens when someone clicks "Connect"

-- Example (replace with real profile IDs):
-- INSERT INTO connections (requester_profile_id, recipient_profile_id, status)
-- VALUES (
--     'profile-uuid-1',  -- Replace with actual requester profile ID
--     'profile-uuid-2',  -- Replace with actual recipient profile ID  
--     'pending'
-- );

-- 3. Check if the connection was created
SELECT 'Test connection created:' as info;
SELECT 
    c.id,
    c.status,
    c.requester_profile_id,
    c.recipient_profile_id,
    rp.first_name as requester_name,
    rcp.first_name as recipient_name
FROM connections c
LEFT JOIN profiles rp ON rp.id = c.requester_profile_id
LEFT JOIN profiles rcp ON rcp.id = c.recipient_profile_id
ORDER BY c.created_at DESC
LIMIT 5;

-- 4. Test the query that the API uses to fetch connections
-- Replace 'test-profile-id' with an actual profile ID
-- SELECT 'Testing API query for profile:' as info;
-- SELECT 
--     c.*,
--     rp.first_name as requester_first_name,
--     rp.last_name as requester_last_name,
--     rcp.first_name as recipient_first_name,
--     rcp.last_name as recipient_last_name
-- FROM connections c
-- LEFT JOIN profiles rp ON rp.id = c.requester_profile_id
-- LEFT JOIN profiles rcp ON rcp.id = c.recipient_profile_id
-- WHERE c.requester_profile_id = 'test-profile-id' 
--    OR c.recipient_profile_id = 'test-profile-id'
-- ORDER BY c.created_at DESC;
