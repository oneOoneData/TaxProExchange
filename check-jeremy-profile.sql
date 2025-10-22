-- Check Jeremy's profile to understand what state it was in
SELECT 
  id,
  clerk_id,
  clerk_user_id,
  first_name,
  last_name,
  public_email,
  onboarding_complete,
  created_at,
  updated_at,
  CASE 
    WHEN clerk_id IS NULL AND clerk_user_id IS NOT NULL THEN 'Had only clerk_user_id'
    WHEN clerk_id IS NOT NULL AND clerk_user_id IS NULL THEN 'Has only clerk_id'
    WHEN clerk_id = clerk_user_id THEN 'Both match'
    WHEN clerk_id != clerk_user_id THEN 'Mismatched'
    ELSE 'Both NULL'
  END as id_status
FROM profiles
WHERE public_email = 'jeremy@steadfastbookkeeping.com';

