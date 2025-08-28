-- Add onboarding_complete column to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS onboarding_complete BOOLEAN DEFAULT false;

-- Update existing profiles to mark them as complete if they have required fields
UPDATE profiles 
SET onboarding_complete = true 
WHERE first_name IS NOT NULL 
  AND last_name IS NOT NULL 
  AND headline IS NOT NULL 
  AND bio IS NOT NULL 
  AND credential_type IS NOT NULL;
