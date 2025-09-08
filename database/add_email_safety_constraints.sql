-- Add safety constraints to prevent duplicate congratulatory emails
-- Run this in your Supabase SQL Editor

-- Add a unique constraint to prevent multiple notifications for the same profile
-- (This is more of a safety net - the application logic should prevent this)
ALTER TABLE profiles 
ADD CONSTRAINT check_notified_verified_listed_at 
CHECK (
  (notified_verified_listed_at IS NULL) OR 
  (notified_verified_listed_at IS NOT NULL AND visibility_state = 'verified' AND is_listed = true)
);

-- Add an index for faster lookups when checking notification status
CREATE INDEX IF NOT EXISTS idx_profiles_email_notification_check 
ON profiles(visibility_state, is_listed, notified_verified_listed_at) 
WHERE visibility_state = 'verified' AND is_listed = true;

-- Verify the constraints
SELECT 
    conname as constraint_name,
    contype as constraint_type,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'profiles'::regclass 
  AND conname = 'check_notified_verified_listed_at';
