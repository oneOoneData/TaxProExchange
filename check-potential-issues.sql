-- Quick check for profiles that might have clerk_id issues
-- These are indicators but not definitive proof

-- 1. Profiles that failed to complete onboarding (might be stuck like Jeremy was)
SELECT 
  'Incomplete onboarding (>7 days old)' as issue_type,
  COUNT(*) as count
FROM profiles
WHERE onboarding_complete = false
  AND created_at < NOW() - INTERVAL '7 days'

UNION ALL

-- 2. Profiles with very old updated_at (haven't been able to update recently?)
SELECT 
  'Not updated in 30+ days',
  COUNT(*)
FROM profiles
WHERE updated_at < NOW() - INTERVAL '30 days'
  AND created_at < NOW() - INTERVAL '30 days';

-- 3. List profiles with incomplete onboarding (potential stuck users)
SELECT 
  id,
  first_name,
  last_name,
  public_email,
  clerk_id,
  created_at,
  updated_at,
  onboarding_complete,
  DATE_PART('day', NOW() - created_at) as days_since_created
FROM profiles
WHERE onboarding_complete = false
  AND created_at < NOW() - INTERVAL '7 days'
ORDER BY created_at DESC;

