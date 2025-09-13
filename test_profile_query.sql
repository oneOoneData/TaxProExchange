-- Test the exact query that should work for your profile
SELECT * 
FROM profiles 
WHERE clerk_id = 'user_31vIO0u5Tll3k2sSwpbG72qPOQH'
   OR clerk_user_id = 'user_31vIO0u5Tll3k2sSwpbG72qPOQH';

-- Also check if there are any RLS (Row Level Security) issues
SELECT 
  id, 
  first_name, 
  last_name, 
  clerk_id, 
  clerk_user_id, 
  onboarding_complete,
  is_deleted
FROM profiles 
WHERE id = '8123510e-0b15-46e9-b6d5-f7e1695bdadb';
