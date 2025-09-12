-- Test the jobs API logic directly in the database
-- This simulates what the API should be doing

-- 1. Test the manual join logic that the API now uses
SELECT 
    j.id,
    j.title,
    j.created_by,
    j.created_at,
    p.first_name,
    p.last_name,
    p.firm_name,
    p.visibility_state,
    p.slug
FROM jobs j
LEFT JOIN profiles p ON j.created_by = p.clerk_id
ORDER BY j.created_at DESC
LIMIT 5;

-- 2. Test if we can find profiles by clerk_id
SELECT 
    id,
    clerk_id,
    first_name,
    last_name,
    firm_name,
    visibility_state
FROM profiles 
WHERE clerk_id IS NOT NULL
ORDER BY created_at DESC
LIMIT 5;

-- 3. Check if there are any jobs that can't find their creator profile
SELECT 
    j.id,
    j.title,
    j.created_by,
    CASE 
        WHEN p.clerk_id IS NULL THEN 'NO PROFILE FOUND'
        ELSE 'PROFILE FOUND'
    END as profile_status
FROM jobs j
LEFT JOIN profiles p ON j.created_by = p.clerk_id
ORDER BY j.created_at DESC
LIMIT 10;
