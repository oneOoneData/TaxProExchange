-- Check for clerk_id vs clerk_user_id mismatches across all profiles
SELECT 
  id,
  first_name,
  last_name,
  clerk_id,
  clerk_user_id,
  user_id,
  onboarding_complete,
  created_at
FROM profiles 
WHERE 
  (clerk_id IS NOT NULL AND clerk_user_id IS NOT NULL AND clerk_id != clerk_user_id)
  OR (clerk_id IS NOT NULL AND clerk_user_id IS NULL)
  OR (clerk_id IS NULL AND clerk_user_id IS NOT NULL)
ORDER BY created_at DESC;

-- Also check how many profiles have each field populated
SELECT 
  COUNT(*) as total_profiles,
  COUNT(clerk_id) as has_clerk_id,
  COUNT(clerk_user_id) as has_clerk_user_id,
  COUNT(user_id) as has_user_id,
  COUNT(CASE WHEN clerk_id = clerk_user_id THEN 1 END) as clerk_ids_match
FROM profiles;
