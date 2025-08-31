-- Add connections table for messaging system
-- Run this in your Supabase SQL Editor

-- Create connections table
CREATE TABLE IF NOT EXISTS connections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    requester_profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    recipient_profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
    stream_channel_id TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(requester_profile_id, recipient_profile_id)
);

-- Add index for Stream channel lookups
CREATE INDEX IF NOT EXISTS idx_connections_stream_channel_id ON connections(stream_channel_id);
CREATE INDEX IF NOT EXISTS idx_connections_status ON connections(status);
CREATE INDEX IF NOT EXISTS idx_connections_requester ON connections(requester_profile_id);
CREATE INDEX IF NOT EXISTS idx_connections_recipient ON connections(recipient_profile_id);

-- Enable RLS
ALTER TABLE connections ENABLE ROW LEVEL SECURITY;

-- RLS policies: users can only see connections they're involved in
CREATE POLICY "connections_self_read" ON connections
    FOR SELECT USING (
        requester_profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()) OR
        recipient_profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
    );

CREATE POLICY "connections_self_insert" ON connections
    FOR INSERT WITH CHECK (
        requester_profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
    );

CREATE POLICY "connections_self_update" ON connections
    FOR UPDATE USING (
        recipient_profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
    );

-- Grant permissions
GRANT ALL ON connections TO authenticated;
GRANT SELECT ON connections TO anon;

-- Create trigger for updated_at
CREATE TRIGGER update_connections_updated_at BEFORE UPDATE ON connections
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Print completion message
DO $$
BEGIN
    RAISE NOTICE 'Connections table created successfully with Stream Chat support!';
    RAISE NOTICE 'RLS policies enabled for security';
END $$;
