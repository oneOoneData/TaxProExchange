-- Fix applications access denied issue for non-admin users
-- This script addresses Clerk ID mismatches that prevent users from seeing their applications

-- 1. First, let's see the current state of applications and their applicant_user_id values
SELECT 
  ja.id,
  ja.applicant_profile_id,
  ja.applicant_user_id,
  p.clerk_id as profile_clerk_id,
  p.first_name,
  p.last_name,
  p.public_email,
  CASE 
    WHEN ja.applicant_user_id = p.clerk_id THEN 'MATCH'
    WHEN ja.applicant_user_id IS NULL THEN 'NULL_APPLICANT_USER_ID'
    ELSE 'MISMATCH'
  END as status
FROM job_applications ja
JOIN profiles p ON ja.applicant_profile_id = p.id
ORDER BY ja.created_at DESC
LIMIT 20;

-- 2. Count mismatches
SELECT 
  COUNT(*) as total_applications,
  COUNT(CASE WHEN ja.applicant_user_id = p.clerk_id THEN 1 END) as matching_ids,
  COUNT(CASE WHEN ja.applicant_user_id != p.clerk_id THEN 1 END) as mismatched_ids,
  COUNT(CASE WHEN ja.applicant_user_id IS NULL THEN 1 END) as null_applicant_user_id
FROM job_applications ja
JOIN profiles p ON ja.applicant_profile_id = p.id;

-- 3. Fix the applicant_user_id field to match the profile's clerk_id
UPDATE job_applications 
SET applicant_user_id = p.clerk_id
FROM profiles p
WHERE job_applications.applicant_profile_id = p.id
  AND (job_applications.applicant_user_id != p.clerk_id OR job_applications.applicant_user_id IS NULL)
  AND p.clerk_id IS NOT NULL;

-- 4. Update the RLS policy to be more robust
-- Drop the existing policy
DROP POLICY IF EXISTS "applicant can see own applications" ON job_applications;

-- Create a more robust policy that handles both applicant_user_id and profile-based lookups
CREATE POLICY "applicant can see own applications"
ON job_applications FOR SELECT
USING (
  -- Check if the current user's clerk_id matches the applicant_user_id
  applicant_user_id = clerk_user_id()
  OR 
  -- Check if the current user's clerk_id matches the profile's clerk_id
  EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.id = job_applications.applicant_profile_id 
    AND p.clerk_id = clerk_user_id()
  )
  OR
  -- Check if the current user is the job creator (for viewing received applications)
  EXISTS (
    SELECT 1 FROM jobs j 
    WHERE j.id = job_applications.job_id 
    AND j.created_by = clerk_user_id()
  )
);

-- 5. Also update the update policy to be consistent
DROP POLICY IF EXISTS "update own application" ON job_applications;

CREATE POLICY "update own application"
ON job_applications FOR UPDATE
USING (
  -- Check if the current user's clerk_id matches the applicant_user_id
  applicant_user_id = clerk_user_id()
  OR 
  -- Check if the current user's clerk_id matches the profile's clerk_id
  EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.id = job_applications.applicant_profile_id 
    AND p.clerk_id = clerk_user_id()
  )
  OR
  -- Check if the current user is the job creator (for updating application status)
  EXISTS (
    SELECT 1 FROM jobs j 
    WHERE j.id = job_applications.job_id 
    AND j.created_by = clerk_user_id()
  )
)
WITH CHECK (true);

-- 6. Verify the fix worked
SELECT 
  'After fix' as status,
  COUNT(*) as total_applications,
  COUNT(CASE WHEN ja.applicant_user_id = p.clerk_id THEN 1 END) as matching_ids,
  COUNT(CASE WHEN ja.applicant_user_id != p.clerk_id THEN 1 END) as mismatched_ids,
  COUNT(CASE WHEN ja.applicant_user_id IS NULL THEN 1 END) as null_applicant_user_id
FROM job_applications ja
JOIN profiles p ON ja.applicant_profile_id = p.id;

-- 7. Test the RLS policy with a sample query
-- This should work for any authenticated user
SELECT 
  ja.id,
  ja.status,
  ja.created_at,
  p.first_name,
  p.last_name
FROM job_applications ja
JOIN profiles p ON ja.applicant_profile_id = p.id
WHERE p.clerk_id = clerk_user_id()
LIMIT 5;
