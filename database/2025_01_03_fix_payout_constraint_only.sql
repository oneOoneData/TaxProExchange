-- 2025_01_03_fix_payout_constraint_only.sql
-- Simple migration to only fix the payout_type constraint
-- Run this in Supabase SQL Editor

-- Drop the existing constraint if it exists
ALTER TABLE public.jobs DROP CONSTRAINT IF EXISTS jobs_payout_type_check;

-- Add the new constraint with the 'discussed' option
ALTER TABLE public.jobs 
ADD CONSTRAINT jobs_payout_type_check 
CHECK (payout_type IN ('fixed', 'hourly', 'per_return', 'discussed'));

-- Also update job_applications table constraint
ALTER TABLE public.job_applications DROP CONSTRAINT IF EXISTS job_applications_proposed_payout_type_check;

ALTER TABLE public.job_applications 
ADD CONSTRAINT job_applications_proposed_payout_type_check 
CHECK (proposed_payout_type IN ('fixed', 'hourly', 'per_return', 'discussed'));

-- Add free_consultation_required column if it doesn't exist
ALTER TABLE public.jobs 
ADD COLUMN IF NOT EXISTS free_consultation_required boolean NOT NULL DEFAULT false;
