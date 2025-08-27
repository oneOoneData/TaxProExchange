-- Fix waitlist RLS policy to allow anonymous inserts
-- This allows the API to insert waitlist submissions without authentication

-- Drop the existing policy
DROP POLICY IF EXISTS "waitlist_insert" ON waitlist;

-- Create a new policy that allows anonymous inserts
CREATE POLICY "waitlist_insert_anonymous" ON waitlist
    FOR INSERT WITH CHECK (true);

-- Alternative: If you prefer to disable RLS entirely for waitlist (simpler approach)
-- ALTER TABLE waitlist DISABLE ROW LEVEL SECURITY;

-- Verify the policy was created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'waitlist';
