-- Remove the foreign key constraint between jobs.created_by and profiles.clerk_id
-- This is a temporary solution since the API code has been fixed to work without the FK
-- Run this in your Supabase SQL Editor

-- Drop the foreign key constraint
ALTER TABLE jobs DROP CONSTRAINT IF EXISTS jobs_created_by_fkey;

-- Verify the constraint was removed
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

-- This should return no rows if the constraint was successfully removed
