-- Add message_notifications to email preferences
-- Run this in your Supabase SQL Editor

-- Update existing profiles to include message_notifications in their email_preferences
UPDATE profiles 
SET email_preferences = COALESCE(email_preferences, '{}'::jsonb) || '{"message_notifications": true}'::jsonb
WHERE email_preferences IS NULL OR NOT (email_preferences ? 'message_notifications');

-- Add comment explaining the new preference
COMMENT ON COLUMN profiles.email_preferences IS 'JSON object containing email notification preferences:
{
  "job_notifications": boolean - receive emails about new jobs matching criteria,
  "application_updates": boolean - receive emails about application status changes,
  "connection_requests": boolean - receive emails about new connection requests,
  "message_notifications": boolean - receive emails about new messages from connections,
  "verification_emails": boolean - receive emails about verification status,
  "marketing_updates": boolean - receive marketing/newsletter emails,
  "frequency": "immediate" | "daily" | "weekly" | "never"
}';
