-- Debug script to check user profile and potentially create one
-- Run this in your Supabase SQL Editor

-- 1. Check if user exists in profiles table
SELECT 
    id, 
    clerk_id, 
    first_name, 
    last_name, 
    credential_type,
    visibility_state,
    created_at
FROM profiles 
WHERE clerk_id = 'user_31vIO0u5Tll3k2sSwpbG72qPOQH';

-- 2. Check all profiles to see if there are any similar clerk_ids
SELECT 
    id, 
    clerk_id, 
    first_name, 
    last_name, 
    credential_type,
    visibility_state,
    created_at
FROM profiles 
WHERE clerk_id LIKE 'user_31vIO0u5Tll3k2sSwpbG72qPOQH%'
   OR clerk_id LIKE '%31vIO0u5Tll3k2sSwpbG72qPOQH%';

-- 3. If no profile exists, create one manually
-- (Uncomment the following lines if needed)
/*
INSERT INTO profiles (
    clerk_id,
    first_name,
    last_name,
    headline,
    credential_type,
    visibility_state,
    is_listed,
    slug,
    created_at,
    updated_at
) VALUES (
    'user_31vIO0u5Tll3k2sSwpbG72qPOQH',
    'User',
    'Name',
    'New Professional',
    'Other',
    'pending',
    false,
    'user-31vIO0u5Tll3k2sSwpbG72qPOQH-' || extract(epoch from now())::bigint,
    NOW(),
    NOW()
);
*/
