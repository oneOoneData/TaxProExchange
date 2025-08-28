-- Debug script to check Clerk constraint issues
-- Run this in your Supabase SQL Editor

-- 1. Check if clerk_id column exists and its constraints
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'profiles' AND column_name = 'clerk_id';

-- 2. Check for any unique constraints on clerk_id
SELECT 
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name = 'profiles' 
    AND kcu.column_name = 'clerk_id';

-- 3. Check for any duplicate clerk_ids (this should return 0 rows if constraint is working)
SELECT 
    clerk_id,
    COUNT(*) as count
FROM profiles 
WHERE clerk_id IS NOT NULL
GROUP BY clerk_id 
HAVING COUNT(*) > 1;

-- 4. Check all profiles with their clerk_ids
SELECT 
    id,
    clerk_id,
    first_name,
    last_name,
    created_at
FROM profiles 
WHERE clerk_id IS NOT NULL
ORDER BY created_at DESC;

-- 5. Check if there are any profiles without clerk_id
SELECT 
    id,
    user_id,
    clerk_id,
    first_name,
    last_name
FROM profiles 
WHERE clerk_id IS NULL;

-- 6. Check table structure to see all columns
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'profiles'
ORDER BY ordinal_position;
