-- Simple messaging data check - run this first
-- Copy and paste this into your Supabase SQL Editor

-- 1. Check if there are any connections at all
SELECT 'STEP 1: Basic connection counts' as info;
SELECT 
    status,
    COUNT(*) as count
FROM connections 
GROUP BY status
ORDER BY status;

-- 2. Show actual connection data
SELECT 'STEP 2: All connections with user details' as info;
SELECT 
    c.id as connection_id,
    c.status,
    c.created_at,
    c.stream_channel_id,
    -- Requester info
    CONCAT(rp.first_name, ' ', rp.last_name) as requester_name,
    rp.credential_type as requester_type,
    -- Recipient info
    CONCAT(rcp.first_name, ' ', rcp.last_name) as recipient_name,
    rcp.credential_type as recipient_type,
    -- Messaging status
    CASE 
        WHEN c.stream_channel_id IS NOT NULL THEN '✅ Can message'
        WHEN c.status = 'accepted' THEN '❌ No messaging channel'
        ELSE '⏳ Pending acceptance'
    END as messaging_status
FROM connections c
LEFT JOIN profiles rp ON rp.id = c.requester_profile_id
LEFT JOIN profiles rcp ON rcp.id = c.recipient_profile_id
ORDER BY c.created_at DESC
LIMIT 20;

-- 3. Check if there are any profiles at all
SELECT 'STEP 3: Profile counts' as info;
SELECT 
    'Total profiles' as metric,
    COUNT(*) as count
FROM profiles
UNION ALL
SELECT 
    'Listed profiles' as metric,
    COUNT(*) as count
FROM profiles 
WHERE is_listed = true
UNION ALL
SELECT 
    'Verified profiles' as metric,
    COUNT(*) as count
FROM profiles 
WHERE visibility_state = 'verified';
