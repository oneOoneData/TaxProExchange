-- Add user suggestion tracking fields to events table
-- This allows us to track who suggested an event and when

-- Add suggested_by column (foreign key to profiles)
ALTER TABLE events 
ADD COLUMN IF NOT EXISTS suggested_by UUID REFERENCES profiles(id);

-- Add suggested_at column (timestamp)
ALTER TABLE events 
ADD COLUMN IF NOT EXISTS suggested_at TIMESTAMPTZ;

-- Add admin_notes column for storing suggestion details
ALTER TABLE events 
ADD COLUMN IF NOT EXISTS admin_notes TEXT;

-- Create index on suggested_by for performance
CREATE INDEX IF NOT EXISTS idx_events_suggested_by ON events(suggested_by);

-- Create index on suggested_at for performance
CREATE INDEX IF NOT EXISTS idx_events_suggested_at ON events(suggested_at);

-- Add comment to document the purpose
COMMENT ON COLUMN events.suggested_by IS 'ID of the user who suggested this event (if applicable)';
COMMENT ON COLUMN events.suggested_at IS 'Timestamp when this event was suggested by a user';
COMMENT ON COLUMN events.admin_notes IS 'Admin notes about the event, including suggestion details';
