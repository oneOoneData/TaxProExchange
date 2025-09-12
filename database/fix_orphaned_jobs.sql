-- Fix orphaned jobs that have created_by values not matching any profile clerk_id
-- Run this in your Supabase SQL Editor

-- First, let's see what orphaned jobs we have
SELECT 
    j.id,
    j.created_by,
    j.title,
    j.created_at,
    p.clerk_id,
    p.id as profile_id
FROM jobs j
LEFT JOIN profiles p ON j.created_by = p.clerk_id
WHERE p.clerk_id IS NULL
ORDER BY j.created_at DESC;

-- Check if there are any profiles with matching clerk_ids but different casing or formatting
SELECT 
    j.id,
    j.created_by,
    p.clerk_id,
    p.id as profile_id
FROM jobs j
LEFT JOIN profiles p ON LOWER(j.created_by) = LOWER(p.clerk_id)
WHERE p.clerk_id IS NOT NULL
AND j.created_by != p.clerk_id;

-- Option 1: Delete orphaned jobs (if they're test data)
-- WARNING: This will permanently delete jobs that don't have matching profiles
-- DELETE FROM jobs 
-- WHERE created_by NOT IN (SELECT clerk_id FROM profiles WHERE clerk_id IS NOT NULL);

-- Option 2: Update orphaned jobs to use a default profile (if you have one)
-- First, let's see if there's a default admin profile we can use
SELECT id, clerk_id, first_name, last_name, firm_name 
FROM profiles 
WHERE clerk_id IS NOT NULL 
ORDER BY created_at ASC 
LIMIT 5;

-- Option 3: Temporarily disable the foreign key constraint, clean up data, then re-enable
-- This is the safest approach

-- Step 1: Drop the foreign key constraint temporarily
ALTER TABLE jobs DROP CONSTRAINT IF EXISTS jobs_created_by_fkey;

-- Step 2: Clean up orphaned jobs (choose one approach)
-- Approach A: Delete orphaned jobs
DELETE FROM jobs 
WHERE created_by NOT IN (SELECT clerk_id FROM profiles WHERE clerk_id IS NOT NULL);

-- Approach B: Update orphaned jobs to use a specific profile (uncomment and modify as needed)
-- UPDATE jobs 
-- SET created_by = 'your_admin_clerk_id_here'
-- WHERE created_by NOT IN (SELECT clerk_id FROM profiles WHERE clerk_id IS NOT NULL);

-- Step 3: Re-add the foreign key constraint
ALTER TABLE jobs 
ADD CONSTRAINT jobs_created_by_fkey 
FOREIGN KEY (created_by) REFERENCES profiles(clerk_id) 
ON DELETE CASCADE;

-- Step 4: Verify the constraint works
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
    AND tc.table_name = 'jobs'
    AND tc.constraint_name = 'jobs_created_by_fkey';

-- Step 5: Verify no orphaned jobs remain
SELECT COUNT(*) as orphaned_jobs_count
FROM jobs j
LEFT JOIN profiles p ON j.created_by = p.clerk_id
WHERE p.clerk_id IS NULL;
