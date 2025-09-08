-- 2025_01_03_update_payout_type_constraint.sql
-- Update the payout_type check constraint to include 'discussed' option
-- This migration is idempotent and safely updates the constraint

DO $$
BEGIN
  -- Drop the existing constraint if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'jobs_payout_type_check' 
    AND table_name = 'jobs'
  ) THEN
    ALTER TABLE public.jobs DROP CONSTRAINT jobs_payout_type_check;
  END IF;

  -- Add the new constraint with the 'discussed' option
  ALTER TABLE public.jobs 
  ADD CONSTRAINT jobs_payout_type_check 
  CHECK (payout_type IN ('fixed', 'hourly', 'per_return', 'discussed'));
END $$;

-- Also update the job_applications table constraint if it exists
DO $$
BEGIN
  -- Drop the existing constraint if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'job_applications_proposed_payout_type_check' 
    AND table_name = 'job_applications'
  ) THEN
    ALTER TABLE public.job_applications DROP CONSTRAINT job_applications_proposed_payout_type_check;
  END IF;

  -- Add the new constraint with the 'discussed' option
  ALTER TABLE public.job_applications 
  ADD CONSTRAINT job_applications_proposed_payout_type_check 
  CHECK (proposed_payout_type IN ('fixed', 'hourly', 'per_return', 'discussed'));
END $$;
