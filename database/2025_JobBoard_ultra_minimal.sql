-- TaxProExchange Job Board - Ultra Minimal Migration
-- Run this in your Supabase SQL Editor to add ONLY the missing review tables

-- 1. Create missing review tables
CREATE TABLE IF NOT EXISTS reviews_firm_by_preparer (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  reviewer_user_id TEXT NOT NULL,                   -- preparer's Clerk id
  reviewee_user_id TEXT NOT NULL,                   -- firm's Clerk id
  ratings JSONB NOT NULL,                           -- {pay_timeliness:1-5, sla_adherence:1-5, comms:1-5}
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(job_id, reviewer_user_id)
);

CREATE TABLE IF NOT EXISTS reviews_preparer_by_firm (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  reviewer_user_id TEXT NOT NULL,                   -- firm's Clerk id
  reviewee_profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  ratings JSONB NOT NULL,                           -- {quality:1-5, sla_adherence:1-5, comms:1-5}
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(job_id, reviewee_profile_id)
);

-- 2. Create helper function to get Clerk user ID from JWT claims
CREATE OR REPLACE FUNCTION clerk_user_id()
RETURNS TEXT LANGUAGE SQL STABLE AS
$$ SELECT COALESCE(current_setting('request.jwt.claims', true)::jsonb->>'sub','') $$;

-- 3. Create helper function to check if user can post jobs (verified firm)
CREATE OR REPLACE FUNCTION can_post_jobs(user_clerk_id TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles 
    WHERE clerk_id = user_clerk_id 
    AND visibility_state = 'verified' 
    AND firm_name IS NOT NULL
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Create helper function to check if user can apply to jobs (verified preparer)
CREATE OR REPLACE FUNCTION can_apply_to_jobs(user_clerk_id TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles 
    WHERE clerk_id = user_clerk_id 
    AND visibility_state = 'verified'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Print completion message
DO $$
BEGIN
  RAISE NOTICE 'Job Board ultra-minimal migration completed successfully!';
  RAISE NOTICE 'Added: review tables and helper functions only';
  RAISE NOTICE 'Skipped: indexes and RLS policies (already exist)';
END $$;
