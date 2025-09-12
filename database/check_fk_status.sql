-- Check the current status of foreign key constraints
-- Run this in your Supabase SQL Editor

-- 1. Check if the jobs_created_by_fkey constraint still exists
SELECT 
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_name = 'jobs';

-- 2. Check if there are still orphaned jobs
SELECT COUNT(*) as orphaned_jobs_count
FROM jobs j
LEFT JOIN profiles p ON j.created_by = p.clerk_id
WHERE p.clerk_id IS NULL;

-- 3. Show sample orphaned jobs if any exist
SELECT 
    j.id,
    j.created_by,
    j.title,
    j.created_at
FROM jobs j
LEFT JOIN profiles p ON j.created_by = p.clerk_id
WHERE p.clerk_id IS NULL
LIMIT 5;

-- 4. Check if the API is still trying to use the foreign key relationship
-- This will show us if there are any remaining references to jobs_created_by_fkey
SELECT 'Check if any jobs have been created recently' as info;
SELECT 
    id,
    created_by,
    title,
    created_at
FROM jobs 
ORDER BY created_at DESC 
LIMIT 3;
