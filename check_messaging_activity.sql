-- Check if people are messaging each other
-- Run this in your Supabase SQL Editor

-- =========================================
-- 1. OVERVIEW: Total messaging activity
-- =========================================
SELECT 'MESSAGING OVERVIEW' as section;

-- Count total accepted connections (these can message each other)
SELECT 
    'Total accepted connections' as metric,
    COUNT(*) as count
FROM connections 
WHERE status = 'accepted';

-- Count connections with Stream channels (active messaging)
SELECT 
    'Connections with messaging channels' as metric,
    COUNT(*) as count
FROM connections 
WHERE status = 'accepted' 
AND stream_channel_id IS NOT NULL;

-- =========================================
-- 2. CONNECTION DETAILS: Who can message whom
-- =========================================
SELECT 'ACTIVE MESSAGING CONNECTIONS' as section;

-- Show all accepted connections with messaging capability
SELECT 
    c.id as connection_id,
    c.status,
    c.stream_channel_id,
    c.created_at as connection_created,
    c.updated_at as last_updated,
    -- Requester details
    rp.first_name as requester_first_name,
    rp.last_name as requester_last_name,
    rp.credential_type as requester_credential,
    rp.firm_name as requester_firm,
    -- Recipient details  
    rcp.first_name as recipient_first_name,
    rcp.last_name as recipient_last_name,
    rcp.credential_type as recipient_credential,
    rcp.firm_name as recipient_firm,
    -- Connection timing
    CASE 
        WHEN c.stream_channel_id IS NOT NULL THEN 'Can message'
        ELSE 'No messaging channel'
    END as messaging_status
FROM connections c
LEFT JOIN profiles rp ON rp.id = c.requester_profile_id
LEFT JOIN profiles rcp ON rcp.id = c.recipient_profile_id
WHERE c.status = 'accepted'
ORDER BY c.created_at DESC;

-- =========================================
-- 3. RECENT CONNECTIONS: New messaging pairs
-- =========================================
SELECT 'RECENT MESSAGING CONNECTIONS (Last 7 days)' as section;

-- Show connections created in the last 7 days
SELECT 
    c.id as connection_id,
    c.stream_channel_id,
    c.created_at,
    CONCAT(rp.first_name, ' ', rp.last_name) as requester_name,
    CONCAT(rcp.first_name, ' ', rcp.last_name) as recipient_name,
    CASE 
        WHEN c.stream_channel_id IS NOT NULL THEN 'Messaging enabled'
        ELSE 'Pending messaging setup'
    END as status
FROM connections c
LEFT JOIN profiles rp ON rp.id = c.requester_profile_id
LEFT JOIN profiles rcp ON rcp.id = c.recipient_profile_id
WHERE c.status = 'accepted'
AND c.created_at >= NOW() - INTERVAL '7 days'
ORDER BY c.created_at DESC;

-- =========================================
-- 4. MESSAGING STATS: By user
-- =========================================
SELECT 'MESSAGING STATS BY USER' as section;

-- Count how many messaging connections each user has
SELECT 
    p.id as profile_id,
    CONCAT(p.first_name, ' ', p.last_name) as full_name,
    p.credential_type,
    p.firm_name,
    COUNT(c.id) as total_connections,
    COUNT(CASE WHEN c.stream_channel_id IS NOT NULL THEN 1 END) as active_messaging_connections,
    COUNT(CASE WHEN c.requester_profile_id = p.id THEN 1 END) as connections_initiated,
    COUNT(CASE WHEN c.recipient_profile_id = p.id THEN 1 END) as connections_received
FROM profiles p
LEFT JOIN connections c ON (c.requester_profile_id = p.id OR c.recipient_profile_id = p.id) 
    AND c.status = 'accepted'
WHERE p.is_listed = true
GROUP BY p.id, p.first_name, p.last_name, p.credential_type, p.firm_name
HAVING COUNT(c.id) > 0
ORDER BY total_connections DESC, active_messaging_connections DESC;

-- =========================================
-- 5. PENDING CONNECTIONS: Not yet messaging
-- =========================================
SELECT 'PENDING CONNECTIONS (No messaging yet)' as section;

-- Show accepted connections without messaging channels
SELECT 
    c.id as connection_id,
    c.status,
    c.created_at,
    CONCAT(rp.first_name, ' ', rp.last_name) as requester_name,
    CONCAT(rcp.first_name, ' ', rcp.last_name) as recipient_name,
    'Needs messaging channel setup' as issue
FROM connections c
LEFT JOIN profiles rp ON rp.id = c.requester_profile_id
LEFT JOIN profiles rcp ON rcp.id = c.recipient_profile_id
WHERE c.status = 'accepted'
AND c.stream_channel_id IS NULL
ORDER BY c.created_at DESC;

-- =========================================
-- 6. CONNECTION REQUESTS: Not yet accepted
-- =========================================
SELECT 'PENDING CONNECTION REQUESTS' as section;

-- Show pending connection requests
SELECT 
    c.id as connection_id,
    c.status,
    c.created_at,
    CONCAT(rp.first_name, ' ', rp.last_name) as requester_name,
    CONCAT(rcp.first_name, ' ', rcp.last_name) as recipient_name,
    'Awaiting acceptance' as status
FROM connections c
LEFT JOIN profiles rp ON rp.id = c.requester_profile_id
LEFT JOIN profiles rcp ON rcp.id = c.recipient_profile_id
WHERE c.status = 'pending'
ORDER BY c.created_at DESC;

-- =========================================
-- 7. SUMMARY STATS
-- =========================================
SELECT 'SUMMARY STATISTICS' as section;

SELECT 
    'Total profiles' as metric,
    COUNT(*) as count
FROM profiles 
WHERE is_listed = true;

SELECT 
    'Total connections' as metric,
    COUNT(*) as count
FROM connections;

SELECT 
    'Accepted connections' as metric,
    COUNT(*) as count
FROM connections 
WHERE status = 'accepted';

SELECT 
    'Connections with messaging' as metric,
    COUNT(*) as count
FROM connections 
WHERE status = 'accepted' 
AND stream_channel_id IS NOT NULL;

SELECT 
    'Pending connections' as metric,
    COUNT(*) as count
FROM connections 
WHERE status = 'pending';
