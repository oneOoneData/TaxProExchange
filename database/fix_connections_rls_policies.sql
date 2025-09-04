-- Fix RLS policies for connections table to work with Clerk authentication
-- The current policies use auth.uid() but we need to use clerk_id from profiles table

-- First, ensure the clerk_user_id() function exists
CREATE OR REPLACE FUNCTION clerk_user_id()
RETURNS TEXT LANGUAGE SQL STABLE AS
$$ SELECT COALESCE(current_setting('request.jwt.claims', true)::jsonb->>'sub','') $$;

-- Drop existing policies
DROP POLICY IF EXISTS "connections_self_read" ON connections;
DROP POLICY IF EXISTS "connections_self_insert" ON connections;
DROP POLICY IF EXISTS "connections_self_update" ON connections;
DROP POLICY IF EXISTS "no_client_access_connections" ON connections;

-- Create new policies that work with Clerk authentication
-- Read: users can see connections where they are either requester or recipient
CREATE POLICY "connections_self_read" ON connections
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles p1 
            WHERE p1.id = connections.requester_profile_id 
            AND p1.clerk_id = clerk_user_id()
        ) OR EXISTS (
            SELECT 1 FROM profiles p2 
            WHERE p2.id = connections.recipient_profile_id 
            AND p2.clerk_id = clerk_user_id()
        )
    );

-- Insert: users can create connections where they are the requester
CREATE POLICY "connections_self_insert" ON connections
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles p 
            WHERE p.id = connections.requester_profile_id 
            AND p.clerk_id = clerk_user_id()
        )
    );

-- Update: users can update connections where they are the recipient (for accepting/declining)
CREATE POLICY "connections_self_update" ON connections
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles p 
            WHERE p.id = connections.recipient_profile_id 
            AND p.clerk_id = clerk_user_id()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles p 
            WHERE p.id = connections.recipient_profile_id 
            AND p.clerk_id = clerk_user_id()
        )
    );

-- Block anonymous access
CREATE POLICY "no_client_access_connections" ON connections
    FOR ALL
    TO anon
    USING (false)
    WITH CHECK (false);

-- Grant permissions
GRANT ALL ON connections TO authenticated;
GRANT SELECT ON connections TO anon;

-- Print completion message
DO $$
BEGIN
    RAISE NOTICE 'Connections table RLS policies updated for Clerk authentication!';
    RAISE NOTICE 'Users can now see connection requests sent to them.';
END $$;
