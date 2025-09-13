-- Fix the clerk_user_id mismatch for Koen's profile
UPDATE profiles 
SET clerk_user_id = 'user_31vIO0u5Tll3k2sSwpbG72qPOQH'
WHERE id = '8123510e-0b15-46e9-b6d5-f7e1695bdadb';

-- Verify the update
SELECT id, first_name, last_name, clerk_id, clerk_user_id, onboarding_complete 
FROM profiles 
WHERE id = '8123510e-0b15-46e9-b6d5-f7e1695bdadb';
