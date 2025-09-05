-- Debug script to check software values in profile_software table
-- Run this in your Supabase SQL Editor

-- First, check if there are any profiles at all
SELECT 'Total profiles count:' as info, COUNT(*) as count FROM profiles;

-- Check if profile_software table exists and has data
SELECT 'Profile software table count:' as info, COUNT(*) as count FROM profile_software;

-- Check what software values are stored in profile_software table
SELECT 
    ps.profile_id,
    p.first_name,
    p.last_name,
    ps.software_slug,
    ps.created_at
FROM profile_software ps
JOIN profiles p ON ps.profile_id = p.id
ORDER BY ps.created_at DESC
LIMIT 20;

-- Check unique software values across all profiles
SELECT 
    software_slug,
    COUNT(*) as profile_count
FROM profile_software
GROUP BY software_slug
ORDER BY profile_count DESC;

-- Check for case variations of common software
SELECT 
    software_slug,
    COUNT(*) as profile_count
FROM profile_software
WHERE software_slug ILIKE '%taxdome%' 
   OR software_slug ILIKE '%drake%'
   OR software_slug ILIKE '%proseries%'
GROUP BY software_slug
ORDER BY software_slug;
