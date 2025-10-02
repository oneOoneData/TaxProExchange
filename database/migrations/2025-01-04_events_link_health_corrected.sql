-- Events Link Health Migration for TaxProExchange (CORRECTED)
-- This migration adds link health validation to the events system

-- Raw ingest table for staging events before validation
CREATE TABLE IF NOT EXISTS staging_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source text NOT NULL,            -- 'calcpa_ics', 'eventbrite', 'ai_generated', etc.
  raw jsonb NOT NULL,
  dedupe_key text,
  created_at timestamptz DEFAULT now()
);

-- Add missing columns to existing events table
ALTER TABLE events ADD COLUMN IF NOT EXISTS organizer text;
ALTER TABLE events ADD COLUMN IF NOT EXISTS region text DEFAULT 'CA';

-- Add link health columns to existing events table
ALTER TABLE events ADD COLUMN IF NOT EXISTS candidate_url text;
ALTER TABLE events ADD COLUMN IF NOT EXISTS canonical_url text;
ALTER TABLE events ADD COLUMN IF NOT EXISTS url_status int;
ALTER TABLE events ADD COLUMN IF NOT EXISTS redirect_chain jsonb;
ALTER TABLE events ADD COLUMN IF NOT EXISTS link_health_score int DEFAULT 0;
ALTER TABLE events ADD COLUMN IF NOT EXISTS last_checked_at timestamptz;
ALTER TABLE events ADD COLUMN IF NOT EXISTS publishable boolean DEFAULT false;
ALTER TABLE events ADD COLUMN IF NOT EXISTS dedupe_key text;

-- Migrate existing url to candidate_url for existing events
UPDATE events SET candidate_url = url WHERE candidate_url IS NULL;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_staging_events_source ON staging_events(source);
CREATE INDEX IF NOT EXISTS idx_staging_events_dedupe ON staging_events(dedupe_key);
CREATE INDEX IF NOT EXISTS idx_events_dedupe_key ON events(dedupe_key);
CREATE INDEX IF NOT EXISTS idx_events_publishable ON events(publishable);
CREATE INDEX IF NOT EXISTS idx_events_link_health ON events(link_health_score);
CREATE INDEX IF NOT EXISTS idx_events_last_checked ON events(last_checked_at);
CREATE INDEX IF NOT EXISTS idx_events_organizer ON events(organizer);
CREATE INDEX IF NOT EXISTS idx_events_region ON events(region);

-- Optional: tombstones for dead/moved URLs so we don't retry forever
CREATE TABLE IF NOT EXISTS event_url_tombstones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  domain text NOT NULL,
  path text NOT NULL,
  reason text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_event_url_tombstones_domain_path ON event_url_tombstones(domain, path);

-- Add RLS policies for new tables
ALTER TABLE staging_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_url_tombstones ENABLE ROW LEVEL SECURITY;

-- Public read policy for staging_events (for debugging/monitoring)
CREATE POLICY staging_events_read_all ON staging_events
FOR SELECT TO authenticated USING (true);

-- Admin write policy for staging_events
CREATE POLICY staging_events_admin_write ON staging_events
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.clerk_id = current_setting('app.clerk_user_id', true)
    AND p.is_admin = true
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.clerk_id = current_setting('app.clerk_user_id', true)
    AND p.is_admin = true
  )
);

-- Public read policy for event_url_tombstones
CREATE POLICY event_url_tombstones_read_all ON event_url_tombstones
FOR SELECT TO authenticated USING (true);

-- Admin write policy for event_url_tombstones
CREATE POLICY event_url_tombstones_admin_write ON event_url_tombstones
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.clerk_id = current_setting('app.clerk_user_id', true)
    AND p.is_admin = true
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.clerk_id = current_setting('app.clerk_user_id', true)
    AND p.is_admin = true
  )
);

-- Add comment explaining the new fields
COMMENT ON COLUMN events.organizer IS 'Event organizer or host name';
COMMENT ON COLUMN events.region IS 'Geographic region (e.g., CA, NY, etc.)';
COMMENT ON COLUMN events.candidate_url IS 'Original URL from source (before validation)';
COMMENT ON COLUMN events.canonical_url IS 'Resolved canonical URL after following redirects';
COMMENT ON COLUMN events.url_status IS 'Last HTTP status code from validation';
COMMENT ON COLUMN events.redirect_chain IS 'Array of URLs visited during redirect resolution';
COMMENT ON COLUMN events.link_health_score IS 'Link health score 0-100, events need >=70 to be publishable';
COMMENT ON COLUMN events.last_checked_at IS 'When this event was last validated';
COMMENT ON COLUMN events.publishable IS 'Whether this event can be shown to users (link health >=70 and checked within 24h)';
COMMENT ON COLUMN events.dedupe_key IS 'SHA1 hash for deduplication: title|start_date|organizer';
