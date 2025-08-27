-- Completely disable RLS for the waitlist table
-- This is the simplest solution for public waitlist submissions

-- Disable RLS on the waitlist table
ALTER TABLE waitlist DISABLE ROW LEVEL SECURITY;

-- Verify RLS is disabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'waitlist';

-- You should see rowsecurity = false for the waitlist table
