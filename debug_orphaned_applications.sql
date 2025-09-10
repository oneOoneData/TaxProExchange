-- Debug orphaned job applications
-- Run this in your Supabase SQL Editor to see what's happening

-- 1. Check if there are applications with missing jobs
SELECT 
  ja.id as application_id,
  ja.job_id,
  j.title as job_title,
  j.created_by as job_owner,
  p.first_name,
  p.last_name,
  CASE 
    WHEN j.id IS NULL THEN 'JOB DELETED'
    ELSE 'JOB EXISTS'
  END as job_status
FROM job_applications ja
LEFT JOIN jobs j ON ja.job_id = j.id
LEFT JOIN profiles p ON ja.applicant_profile_id = p.id
WHERE j.id IS NULL;

-- 2. Check what jobs exist for your user
-- Replace 'your-clerk-id' with your actual Clerk user ID
SELECT 
  id,
  title,
  created_by,
  created_at
FROM jobs 
WHERE created_by = 'your-clerk-id-here'
ORDER BY created_at DESC;

-- 3. Check all applications and their job status
SELECT 
  ja.id as application_id,
  ja.job_id,
  j.title as job_title,
  j.created_by as job_owner,
  p.first_name || ' ' || p.last_name as applicant_name
FROM job_applications ja
LEFT JOIN jobs j ON ja.job_id = j.id
LEFT JOIN profiles p ON ja.applicant_profile_id = p.id
ORDER BY ja.created_at DESC
LIMIT 10;
