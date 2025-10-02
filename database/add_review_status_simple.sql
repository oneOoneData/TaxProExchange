-- Simple migration to add review_status column
-- This is a fallback if the complex migration didn't work

-- Add review status column as text first
ALTER TABLE events ADD COLUMN IF NOT EXISTS review_status text DEFAULT 'pending_review';

-- Add other review-related columns
ALTER TABLE events ADD COLUMN IF NOT EXISTS reviewed_at timestamptz;
ALTER TABLE events ADD COLUMN IF NOT EXISTS reviewed_by uuid REFERENCES profiles(id);
ALTER TABLE events ADD COLUMN IF NOT EXISTS admin_notes text;

-- Update existing events to have pending_review status
UPDATE events SET review_status = 'pending_review' WHERE review_status IS NULL;

-- Create index for review status
CREATE INDEX IF NOT EXISTS idx_events_review_status ON events(review_status);

-- Add comments
COMMENT ON COLUMN events.review_status IS 'Human review status: pending_review, approved, rejected, needs_edit';
COMMENT ON COLUMN events.reviewed_at IS 'When this event was reviewed by an admin';
COMMENT ON COLUMN events.reviewed_by IS 'Admin profile ID who reviewed this event';
COMMENT ON COLUMN events.admin_notes IS 'Admin notes about the event review';
