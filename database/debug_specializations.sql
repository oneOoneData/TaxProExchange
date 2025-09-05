-- Debug script to check specializations data
-- Run this in your Supabase SQL Editor

-- Check if specializations table has data
SELECT 'Specializations table count:' as info, COUNT(*) as count FROM specializations;

-- Check what specializations exist
SELECT 
    id,
    slug,
    label,
    created_at
FROM specializations
ORDER BY label
LIMIT 20;

-- Check if profile_specializations table has data
SELECT 'Profile specializations table count:' as info, COUNT(*) as count FROM profile_specializations;

-- Check what specializations are assigned to profiles
SELECT 
    ps.profile_id,
    p.first_name,
    p.last_name,
    ps.specialization_slug,
    s.label
FROM profile_specializations ps
JOIN profiles p ON ps.profile_id = p.id
LEFT JOIN specializations s ON ps.specialization_slug = s.slug
ORDER BY p.first_name, ps.specialization_slug
LIMIT 20;

-- Check unique specializations and their usage counts
SELECT 
    ps.specialization_slug,
    s.label,
    COUNT(ps.profile_id) as profile_count
FROM profile_specializations ps
LEFT JOIN specializations s ON ps.specialization_slug = s.slug
GROUP BY ps.specialization_slug, s.label
ORDER BY profile_count DESC, ps.specialization_slug;
