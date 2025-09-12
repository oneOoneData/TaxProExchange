-- Add missing foreign key constraint between jobs.created_by and profiles.clerk_id
-- Run this in your Supabase SQL Editor

-- First, let's check if there are any orphaned jobs (jobs with created_by that don't match any profile)
SELECT 
    j.id,
    j.created_by,
    p.clerk_id,
    p.id as profile_id
FROM jobs j
LEFT JOIN profiles p ON j.created_by = p.clerk_id
WHERE p.clerk_id IS NULL
LIMIT 10;

-- Add the foreign key constraint
-- Note: This will fail if there are orphaned records, so we need to handle those first
ALTER TABLE jobs 
ADD CONSTRAINT jobs_created_by_fkey 
FOREIGN KEY (created_by) REFERENCES profiles(clerk_id) 
ON DELETE CASCADE;

-- Create an index for better performance
CREATE INDEX IF NOT EXISTS idx_jobs_created_by_clerk_id ON jobs(created_by);

-- Verify the constraint was added
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
