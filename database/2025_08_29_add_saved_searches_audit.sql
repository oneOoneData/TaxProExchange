-- Migration: Add saved searches and audit tables for job board production hardening
-- Date: 2025-08-29

-- 1. Create pros_saved_searches table
CREATE TABLE IF NOT EXISTS pros_saved_searches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  filters_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  notify_email boolean NOT NULL DEFAULT true,
  notify_sms boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 2. Create audits table
CREATE TABLE IF NOT EXISTS audits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid,
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  action text NOT NULL,            -- job.created, job.applied, job.updated
  meta jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 3. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_saved_searches_user ON pros_saved_searches(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_searches_filters ON pros_saved_searches USING GIN(filters_json);
CREATE INDEX IF NOT EXISTS idx_audits_entity ON audits(entity_type, entity_id, action);
CREATE INDEX IF NOT EXISTS idx_audits_actor ON audits(actor_id);
CREATE INDEX IF NOT EXISTS idx_audits_created ON audits(created_at);

-- 4. Add new columns to jobs table for enhanced features
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS sla_version text DEFAULT 'standard_v1';
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS sla_overrides jsonb DEFAULT '{}'::jsonb;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS has_escrow boolean DEFAULT false;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS fulfillment_mode text DEFAULT 'fixed' CHECK (fulfillment_mode IN ('fixed','shortlist','managed'));
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS compensation_model text DEFAULT 'fixed' CHECK (compensation_model IN ('fixed','hourly','form_based'));
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS floor_fixed_cents integer;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS floor_hourly_cents integer;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS start_date date;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS hard_deadline date;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS volume integer;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS trial_available boolean DEFAULT false;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS trial_scope text;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS training_provided boolean DEFAULT false;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS timezones text[];
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS security_flags jsonb DEFAULT '{}'::jsonb;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS dispute_policy text;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS pay_items jsonb DEFAULT '[]'::jsonb;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS milestones jsonb DEFAULT '[]'::jsonb;

-- 5. Create jobs_milestones table for milestone tracking
CREATE TABLE IF NOT EXISTS jobs_milestones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  name text NOT NULL,
  due_offset_days integer NOT NULL,
  release_percent integer NOT NULL CHECK (release_percent >= 0 AND release_percent <= 100),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_jobs_milestones_job_id ON jobs_milestones(job_id);

-- 6. Enable Row Level Security
ALTER TABLE pros_saved_searches ENABLE ROW LEVEL SECURITY;
ALTER TABLE audits ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs_milestones ENABLE ROW LEVEL SECURITY;

-- 7. Create RLS policies
-- Saved searches: users can only access their own
CREATE POLICY "own_saved_searches" ON pros_saved_searches 
  FOR ALL USING (user_id::text = current_setting('request.jwt.claims', true)::json->>'sub');

-- Audits: read-only for now (can be tightened later)
CREATE POLICY "read_audits" ON audits 
  FOR SELECT USING (true);

-- Milestones: job owners can manage
CREATE POLICY "job_owners_manage_milestones" ON jobs_milestones 
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM jobs j 
      WHERE j.id = jobs_milestones.job_id 
      AND j.created_by = current_setting('request.jwt.claims', true)::json->>'sub'
    )
  );

-- 8. Add constraints and validations
-- Ensure milestones total 100% for a job
CREATE OR REPLACE FUNCTION validate_milestones_total()
RETURNS TRIGGER AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM jobs_milestones 
    WHERE job_id = NEW.job_id 
    GROUP BY job_id 
    HAVING SUM(release_percent) != 100
  ) THEN
    RAISE EXCEPTION 'Milestones must total 100%% for job %', NEW.job_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER validate_milestones_total_trigger
  AFTER INSERT OR UPDATE ON jobs_milestones
  FOR EACH ROW
  EXECUTE FUNCTION validate_milestones_total();

-- 9. Add helpful comments
COMMENT ON TABLE pros_saved_searches IS 'Saved job searches for professionals with notification preferences';
COMMENT ON TABLE audits IS 'Audit log for job lifecycle and user actions';
COMMENT ON TABLE jobs_milestones IS 'Milestone tracking for job completion with payment releases';

-- 10. Success message
DO $$
BEGIN
  RAISE NOTICE 'Migration completed: Added saved searches, audit tables, and enhanced job features';
END $$;
