-- 01_add_working_expectations.sql
-- Add working expectations fields to jobs table
-- This migration is idempotent and checks for existing columns before adding

DO $$
BEGIN
  -- Add working_expectations_md column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='jobs' AND column_name='working_expectations_md'
  ) THEN
    ALTER TABLE public.jobs
      ADD COLUMN working_expectations_md text;
  END IF;

  -- Add draft_eta_date column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='jobs' AND column_name='draft_eta_date'
  ) THEN
    ALTER TABLE public.jobs
      ADD COLUMN draft_eta_date date;
  END IF;

  -- Add final_review_buffer_days column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='jobs' AND column_name='final_review_buffer_days'
  ) THEN
    ALTER TABLE public.jobs
      ADD COLUMN final_review_buffer_days integer NOT NULL DEFAULT 3;
  END IF;

  -- Add pro_liability_required column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='jobs' AND column_name='pro_liability_required'
  ) THEN
    ALTER TABLE public.jobs
      ADD COLUMN pro_liability_required boolean NOT NULL DEFAULT false;
  END IF;
END $$;
