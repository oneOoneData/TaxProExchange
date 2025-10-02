-- Add event review status for human-in-the-loop validation

-- Create enum for review status first
DO $$ BEGIN
    CREATE TYPE event_review_status AS ENUM('pending_review', 'approved', 'rejected', 'needs_edit');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add review status column to events table (without default first)
ALTER TABLE events ADD COLUMN IF NOT EXISTS review_status text;

-- Add review timestamp
ALTER TABLE events ADD COLUMN IF NOT EXISTS reviewed_at timestamptz;

-- Add reviewed by admin
ALTER TABLE events ADD COLUMN IF NOT EXISTS reviewed_by uuid REFERENCES profiles(id);

-- Add admin notes for review
ALTER TABLE events ADD COLUMN IF NOT EXISTS admin_notes text;

-- Update existing events to have pending_review status
UPDATE events SET review_status = 'pending_review' WHERE review_status IS NULL;

-- Now convert the column to use the enum type
ALTER TABLE events ALTER COLUMN review_status TYPE event_review_status USING review_status::event_review_status;

-- Set the default value after conversion
ALTER TABLE events ALTER COLUMN review_status SET DEFAULT 'pending_review';

-- Create index for review status
CREATE INDEX IF NOT EXISTS idx_events_review_status ON events(review_status);

-- Add comment explaining the new fields
COMMENT ON COLUMN events.review_status IS 'Human review status: pending_review, approved, rejected, needs_edit';
COMMENT ON COLUMN events.reviewed_at IS 'When this event was reviewed by an admin';
COMMENT ON COLUMN events.reviewed_by IS 'Admin profile ID who reviewed this event';
COMMENT ON COLUMN events.admin_notes IS 'Admin notes about the event review';
