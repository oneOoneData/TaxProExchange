-- TaxProExchange Job Board Database Migration
-- Run this in your Supabase SQL Editor to add job posting and application functionality

-- Helper function to get Clerk user ID from JWT claims
CREATE OR REPLACE FUNCTION clerk_user_id()
RETURNS TEXT LANGUAGE SQL STABLE AS
$$ SELECT COALESCE(current_setting('request.jwt.claims', true)::jsonb->>'sub','') $$;

-- JOBS table
CREATE TABLE IF NOT EXISTS jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by TEXT NOT NULL,                         -- firm user_id (Clerk)
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','assigned','closed','cancelled')),
  deadline_date DATE,
  payout_type TEXT NOT NULL CHECK (payout_type IN ('fixed','hourly','per_return')),
  payout_fixed NUMERIC(12,2),
  payout_min NUMERIC(12,2),
  payout_max NUMERIC(12,2),
  payment_terms TEXT,                               -- e.g., "Net 7 after acceptance"
  sla JSONB,                                        -- SLA template as JSON
  credentials_required TEXT[] NOT NULL DEFAULT '{}',-- e.g., {'CPA','EA','CTEC','JD','PTIN_ONLY'}
  software_required TEXT[] NOT NULL DEFAULT '{}',   -- e.g., {'ProSeries','Drake'}
  specialization_keys TEXT[] NOT NULL DEFAULT '{}', -- match with specializations.slug
  volume_count INT,                                 -- e.g., 20 returns
  trial_ok BOOLEAN NOT NULL DEFAULT false,
  insurance_required BOOLEAN NOT NULL DEFAULT false,
  location_us_only BOOLEAN NOT NULL DEFAULT true,
  location_states TEXT[] NOT NULL DEFAULT '{}',     -- optional states focus
  location_countries TEXT[] NOT NULL DEFAULT '{}',  -- optional intl focus (ISO-2)
  remote_ok BOOLEAN NOT NULL DEFAULT true,
  assigned_profile_id UUID,                         -- optional winner
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- JOB APPLICATIONS table
CREATE TABLE IF NOT EXISTS job_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  applicant_profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  applicant_user_id TEXT NOT NULL,                  -- Clerk sub (denormalized for RLS)
  cover_note TEXT,
  proposed_rate NUMERIC(12,2),
  proposed_payout_type TEXT CHECK (proposed_payout_type IN ('fixed','hourly','per_return')),
  proposed_timeline TEXT,
  status TEXT NOT NULL DEFAULT 'applied' CHECK (status IN ('applied','shortlisted','hired','withdrawn','rejected','completed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(job_id, applicant_profile_id)
);

-- REVIEWS: firm by preparer
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

-- REVIEWS: preparer by firm
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

-- NOTIFICATION PREFERENCES table
CREATE TABLE IF NOT EXISTS notification_prefs (
  user_id TEXT PRIMARY KEY,                         -- Clerk
  email_enabled BOOLEAN NOT NULL DEFAULT true,
  sms_enabled BOOLEAN NOT NULL DEFAULT false,
  min_payout NUMERIC(12,2),
  payout_type_filter TEXT[],                        -- optional
  specialization_filter TEXT[],                     -- list of specializations slugs
  states_filter TEXT[],                             -- US states
  international BOOLEAN,                            -- matches works_international
  countries_filter TEXT[]                           -- ISO-2 list
);

-- Create indexes for performance
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

-- Enable Row Level Security
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews_firm_by_preparer ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews_preparer_by_firm ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_prefs ENABLE ROW LEVEL SECURITY;

-- JOBS RLS: public read basic fields (SEO), writer = owner
CREATE POLICY "public read jobs"
ON jobs FOR SELECT
USING (true);

CREATE POLICY "insert own jobs"
ON jobs FOR INSERT
WITH CHECK (created_by = clerk_user_id());

CREATE POLICY "update own jobs"
ON jobs FOR UPDATE
USING (created_by = clerk_user_id())
WITH CHECK (created_by = clerk_user_id());

-- APPLICATIONS RLS
CREATE POLICY "applicant can see own applications"
ON job_applications FOR SELECT
USING (applicant_user_id = clerk_user_id()
   OR EXISTS (SELECT 1 FROM jobs j WHERE j.id = job_applications.job_id AND j.created_by = clerk_user_id()));

CREATE POLICY "apply to job as self"
ON job_applications FOR INSERT
WITH CHECK (applicant_user_id = clerk_user_id());

CREATE POLICY "update own application"
ON job_applications FOR UPDATE
USING (applicant_user_id = clerk_user_id()
   OR EXISTS (SELECT 1 FROM jobs j WHERE j.id = job_applications.job_id AND j.created_by = clerk_user_id()))
WITH CHECK (true);

-- REVIEWS RLS
CREATE POLICY "reviews: preparer about firm - author can insert/select"
ON reviews_firm_by_preparer FOR ALL
USING (reviewer_user_id = clerk_user_id())
WITH CHECK (reviewer_user_id = clerk_user_id());

CREATE POLICY "reviews: firm about preparer - author can insert/select"
ON reviews_preparer_by_firm FOR ALL
USING (reviewer_user_id = clerk_user_id())
WITH CHECK (reviewer_user_id = clerk_user_id());

-- NOTIFICATION PREFS RLS
CREATE POLICY "prefs: owner read/write"
ON notification_prefs FOR ALL
USING (user_id = clerk_user_id())
WITH CHECK (user_id = clerk_user_id());

-- Grant permissions
GRANT ALL ON jobs TO authenticated;
GRANT ALL ON job_applications TO authenticated;
GRANT ALL ON reviews_firm_by_preparer TO authenticated;
GRANT ALL ON reviews_preparer_by_firm TO authenticated;
GRANT ALL ON notification_prefs TO authenticated;

GRANT SELECT ON jobs TO anon;
GRANT SELECT ON job_applications TO anon;

-- Helper function to check if user can post jobs (verified firm)
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

-- Helper function to check if user can apply to jobs (verified preparer)
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

-- Insert sample SLA template for UI reference
-- This is just a comment showing the expected JSON structure:
/*
SLA template example (JSON):
{
  "response_time_hours": 24,
  "draft_turnaround_days": 5,
  "revision_rounds_included": 1,
  "data_exchange": "Portal-only (no email attachments)",
  "security": "No unmasked PII in chat; use platform storage",
  "dispute": "If scope creep, pause work and request change in writing"
}
*/

-- Print completion message
DO $$
BEGIN
  RAISE NOTICE 'Job Board database migration completed successfully!';
  RAISE NOTICE 'Tables created: jobs, job_applications, reviews_firm_by_preparer, reviews_preparer_by_firm, notification_prefs';
  RAISE NOTICE 'RLS policies enabled for security';
  RAISE NOTICE 'Helper functions created: clerk_user_id(), can_post_jobs(), can_apply_to_jobs()';
END $$;
