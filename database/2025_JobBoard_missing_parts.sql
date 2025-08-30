-- TaxProExchange Job Board - Missing Parts Migration
-- Run this in your Supabase SQL Editor to complete the Job Board setup

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

-- 5. Create missing indexes for performance
CREATE INDEX IF NOT EXISTS idx_jobs_created_by ON jobs(created_by);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_deadline ON jobs(deadline_date);
CREATE INDEX IF NOT EXISTS idx_jobs_specialization_keys ON jobs USING GIN(specialization_keys);
CREATE INDEX IF NOT EXISTS idx_jobs_location_states ON jobs USING GIN(location_states);
CREATE INDEX IF NOT EXISTS idx_jobs_created_at ON jobs(created_at);

CREATE INDEX IF NOT EXISTS idx_job_applications_job_id ON job_applications(job_id);
CREATE INDEX IF NOT EXISTS idx_job_applications_applicant ON job_applications(applicant_profile_id);
CREATE INDEX IF NOT EXISTS idx_job_applications_status ON job_applications(status);

CREATE INDEX IF NOT EXISTS idx_reviews_job_id ON reviews_firm_by_preparer(job_id);
CREATE INDEX IF NOT EXISTS idx_reviews_job_id_preparer ON reviews_preparer_by_firm(job_id);

-- 6. Enable Row Level Security on all tables
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews_firm_by_preparer ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews_preparer_by_firm ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_prefs ENABLE ROW LEVEL SECURITY;

-- 7. Drop existing RLS policies (if any) and create new ones for jobs table
DROP POLICY IF EXISTS "public read jobs" ON jobs;
DROP POLICY IF EXISTS "firms create jobs" ON jobs;
DROP POLICY IF EXISTS "firms update own jobs" ON jobs;
DROP POLICY IF EXISTS "firms delete own jobs" ON jobs;

CREATE POLICY "public read jobs"
ON jobs FOR SELECT
USING (true);

CREATE POLICY "firms create jobs"
ON jobs FOR INSERT
WITH CHECK (can_post_jobs(clerk_user_id()));

CREATE POLICY "firms update own jobs"
ON jobs FOR UPDATE
USING (created_by = clerk_user_id())
WITH CHECK (created_by = clerk_user_id());

CREATE POLICY "firms delete own jobs"
ON jobs FOR DELETE
USING (created_by = clerk_user_id());

-- 8. Drop existing RLS policies (if any) and create new ones for job_applications table
DROP POLICY IF EXISTS "public read applications" ON job_applications;
DROP POLICY IF EXISTS "preparers apply to jobs" ON job_applications;
DROP POLICY IF EXISTS "users update own applications" ON job_applications;
DROP POLICY IF EXISTS "job owners manage applications" ON job_applications;

CREATE POLICY "public read applications"
ON job_applications FOR SELECT
USING (true);

CREATE POLICY "preparers apply to jobs"
ON job_applications FOR INSERT
WITH CHECK (can_apply_to_jobs(clerk_user_id()));

CREATE POLICY "users update own applications"
ON job_applications FOR UPDATE
USING (applicant_user_id = clerk_user_id())
WITH CHECK (applicant_user_id = clerk_user_id());

CREATE POLICY "job owners manage applications"
ON job_applications FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM jobs 
    WHERE jobs.id = job_applications.job_id 
    AND jobs.created_by = clerk_user_id()
  )
);

-- 9. Create RLS policies for reviews tables
CREATE POLICY "public read reviews"
ON reviews_firm_by_preparer FOR SELECT
USING (true);

CREATE POLICY "public read preparer reviews"
ON reviews_preparer_by_firm FOR SELECT
USING (true);

CREATE POLICY "participants create reviews"
ON reviews_firm_by_preparer FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM job_applications ja
    JOIN jobs j ON ja.job_id = j.id
    WHERE ja.job_id = reviews_firm_by_preparer.job_id
    AND (ja.applicant_user_id = clerk_user_id() OR j.created_by = clerk_user_id())
  )
);

CREATE POLICY "participants create preparer reviews"
ON reviews_preparer_by_firm FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM job_applications ja
    JOIN jobs j ON ja.job_id = j.id
    WHERE ja.job_id = reviews_preparer_by_firm.job_id
    AND (ja.applicant_user_id = clerk_user_id() OR j.created_by = clerk_user_id())
  )
);

-- 10. Drop existing RLS policies (if any) and create new ones for notification_prefs table
DROP POLICY IF EXISTS "users manage own notification prefs" ON notification_prefs;

CREATE POLICY "users manage own notification prefs"
ON notification_prefs FOR ALL
USING (user_id = clerk_user_id())
WITH CHECK (user_id = clerk_user_id());

-- Print completion message
DO $$
BEGIN
  RAISE NOTICE 'Job Board missing parts migration completed successfully!';
  RAISE NOTICE 'Added: review tables, helper functions, indexes, and RLS policies';
END $$;
