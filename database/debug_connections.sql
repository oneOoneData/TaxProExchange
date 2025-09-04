-- Debug script to check connections table and see what's happening
-- Run this in your Supabase SQL Editor

-- 1. Check if connections table exists and has data
SELECT 'Connections table structure:' as info;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'connections' 
ORDER BY ordinal_position;

-- 2. Check if there are any connections in the table
SELECT 'Total connections count:' as info;
SELECT COUNT(*) as total_connections FROM connections;

-- 3. Show all connections with profile details
SELECT 'All connections with profile details:' as info;
SELECT 
    c.id,
    c.status,
    c.created_at,
    c.requester_profile_id,
    c.recipient_profile_id,
    rp.first_name as requester_first_name,
    rp.last_name as requester_last_name,
    rp.clerk_id as requester_clerk_id,
    rcp.first_name as recipient_first_name,
    rcp.last_name as recipient_last_name,
    rcp.clerk_id as recipient_clerk_id
FROM connections c
LEFT JOIN profiles rp ON rp.id = c.requester_profile_id
LEFT JOIN profiles rcp ON rcp.id = c.recipient_profile_id
ORDER BY c.created_at DESC;

-- 4. Check profiles table structure
SELECT 'Profiles table clerk_id column:' as info;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'profiles' AND column_name = 'clerk_id';

-- 5. Show sample profiles with clerk_id
SELECT 'Sample profiles with clerk_id:' as info;
SELECT id, first_name, last_name, clerk_id, created_at
FROM profiles 
WHERE clerk_id IS NOT NULL
ORDER BY created_at DESC
LIMIT 5;

-- 6. Check if there are any profiles without clerk_id
SELECT 'Profiles without clerk_id:' as info;
SELECT COUNT(*) as profiles_without_clerk_id
FROM profiles 
WHERE clerk_id IS NULL;

-- 7. Test the clerk_user_id function
SELECT 'Testing clerk_user_id function:' as info;
SELECT clerk_user_id() as current_clerk_user_id;

-- 8. Check RLS policies on connections table
SELECT 'RLS policies on connections table:' as info;
SELECT policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'connections'
ORDER BY policyname;
