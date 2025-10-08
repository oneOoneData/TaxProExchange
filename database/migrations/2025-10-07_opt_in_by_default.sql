-- Update email preferences default to opt-in for all notifications
-- Run this in Supabase SQL Editor

-- 1. Update the default value for new profiles
ALTER TABLE profiles 
  ALTER COLUMN email_preferences 
  SET DEFAULT '{
    "job_notifications": true,
    "application_updates": true,
    "connection_requests": true,
    "verification_emails": true,
    "message_notifications": true,
    "marketing_updates": true,
    "frequency": "immediate"
  }'::jsonb;

-- 2. Optionally: Update existing profiles that have NULL email_preferences
-- (Only run this if you want existing users to also be opted in)
-- UPDATE profiles 
-- SET email_preferences = '{
--   "job_notifications": true,
--   "application_updates": true,
--   "connection_requests": true,
--   "verification_emails": true,
--   "message_notifications": true,
--   "marketing_updates": true,
--   "frequency": "immediate"
-- }'::jsonb
-- WHERE email_preferences IS NULL;

-- 3. Update comment
COMMENT ON COLUMN profiles.email_preferences IS 'JSON object containing email notification preferences (all default to true for opt-in):
{
  "job_notifications": boolean - receive emails about new jobs matching criteria,
  "application_updates": boolean - receive emails about application status changes,
  "connection_requests": boolean - receive emails about new connection requests,
  "message_notifications": boolean - receive emails about new messages from connections,
  "verification_emails": boolean - receive emails about verification status,
  "marketing_updates": boolean - receive marketing/newsletter emails,
  "frequency": "immediate" | "daily" | "weekly" | "never"
}';

