-- 2025_01_03_add_consultation_field.sql
-- Add free_consultation_required field to jobs table
-- This migration is idempotent and checks for existing columns before adding

DO $$
BEGIN
  -- Add free_consultation_required column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='jobs' AND column_name='free_consultation_required'
  ) THEN
    ALTER TABLE public.jobs
      ADD COLUMN free_consultation_required boolean NOT NULL DEFAULT false;
  END IF;
END $$;
