-- Add email preferences to profiles table
-- Run this in your Supabase SQL Editor

-- Add email preference columns
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email_preferences JSONB DEFAULT '{
  "job_notifications": true,
  "application_updates": true,
  "connection_requests": true,
  "verification_emails": true,
  "marketing_updates": false,
  "frequency": "immediate"
}'::jsonb;

-- Add email frequency options
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email_frequency TEXT DEFAULT 'immediate' CHECK (email_frequency IN ('immediate', 'daily', 'weekly', 'never'));

-- Add last_email_sent timestamp for frequency control
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_email_sent TIMESTAMPTZ;

-- Create index for email preferences
CREATE INDEX IF NOT EXISTS idx_profiles_email_preferences ON profiles USING GIN (email_preferences);

-- Add comment explaining the email preferences structure
COMMENT ON COLUMN profiles.email_preferences IS 'JSON object containing email notification preferences:
{
  "job_notifications": boolean - receive emails about new jobs matching criteria,
  "application_updates": boolean - receive emails about application status changes,
  "connection_requests": boolean - receive emails about new connection requests,
  "verification_emails": boolean - receive emails about verification status,
  "marketing_updates": boolean - receive marketing/newsletter emails,
  "frequency": "immediate" | "daily" | "weekly" | "never"
}';

COMMENT ON COLUMN profiles.email_frequency IS 'How often to send non-critical emails (marketing, updates)';
COMMENT ON COLUMN profiles.last_email_sent IS 'Timestamp of last email sent for frequency control';
