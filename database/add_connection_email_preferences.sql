-- Add email preferences for connection notifications
-- Run this in your Supabase SQL Editor

-- Add email preferences column to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS connection_email_notifications BOOLEAN NOT NULL DEFAULT true;

-- Add comment for clarity
COMMENT ON COLUMN profiles.connection_email_notifications IS 'Whether user wants to receive email notifications for connection requests';

-- Create index for performance when filtering by email preferences
CREATE INDEX IF NOT EXISTS idx_profiles_connection_email_notifications 
ON profiles(connection_email_notifications) 
WHERE connection_email_notifications = true;

-- Update existing profiles to have email notifications enabled by default
UPDATE profiles 
SET connection_email_notifications = true 
WHERE connection_email_notifications IS NULL;

-- Print completion message
DO $$
BEGIN
    RAISE NOTICE 'Connection email preferences added to profiles table!';
    RAISE NOTICE 'Users can now opt out of connection request email notifications.';
END $$;
