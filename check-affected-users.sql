-- Check for users potentially affected by the clerk_id/clerk_user_id mismatch issue
-- Run this in Supabase SQL Editor after Jeremy's fix is verified

-- 1. Overview: How many profiles have each column populated?
SELECT 
  'Total profiles' as metric,
  COUNT(*) as count
FROM profiles
UNION ALL
SELECT 
  'Has clerk_id',
  COUNT(*)
FROM profiles
WHERE clerk_id IS NOT NULL
UNION ALL
SELECT 
  'Has clerk_user_id',
  COUNT(*)
FROM profiles
WHERE clerk_user_id IS NOT NULL
UNION ALL
SELECT 
  'Has both but different',
  COUNT(*)
FROM profiles
WHERE clerk_id IS NOT NULL 
  AND clerk_user_id IS NOT NULL 
  AND clerk_id != clerk_user_id
UNION ALL
SELECT 
  'Has clerk_user_id but NULL clerk_id (AFFECTED)',
  COUNT(*)
FROM profiles
WHERE clerk_user_id IS NOT NULL 
  AND clerk_id IS NULL;

-- 2. List potentially affected users (have clerk_user_id but not clerk_id)
-- These users would hit the same bug Jeremy had
SELECT 
  id,
  first_name,
  last_name,
  public_email,
  clerk_user_id,
  clerk_id,
  created_at,
  onboarding_complete,
  CASE 
    WHEN clerk_id IS NULL AND clerk_user_id IS NOT NULL THEN '🔴 Missing clerk_id'
    WHEN clerk_id != clerk_user_id THEN '🟡 Mismatched IDs'
    ELSE '✅ OK'
  END as status
FROM profiles
WHERE clerk_id IS NULL 
   OR (clerk_id IS NOT NULL AND clerk_user_id IS NOT NULL AND clerk_id != clerk_user_id)
ORDER BY created_at DESC;

-- 3. Profiles with incomplete onboarding (might be stuck like Jeremy was)
SELECT 
  id,
  first_name,
  last_name,
  public_email,
  clerk_id,
  clerk_user_id,
  created_at
FROM profiles
WHERE onboarding_complete = false
  AND created_at < NOW() - INTERVAL '1 day'  -- Created more than 1 day ago
ORDER BY created_at DESC;

