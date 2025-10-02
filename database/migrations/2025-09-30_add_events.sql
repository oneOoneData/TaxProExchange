-- Events table migration for TaxProExchange
-- This creates the events table with RLS policies for curated and AI-generated events

CREATE TYPE event_source AS ENUM('curated','ai_generated');

CREATE TABLE IF NOT EXISTS events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  start_date timestamptz NOT NULL,
  end_date timestamptz,
  location_city text,
  location_state text,
  url text NOT NULL,
  tags text[] NOT NULL DEFAULT '{}',
  source event_source NOT NULL DEFAULT 'ai_generated',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_events_date ON events(start_date);
CREATE INDEX IF NOT EXISTS idx_events_state ON events(location_state);
CREATE INDEX IF NOT EXISTS idx_events_tags_gin ON events USING gin (tags);
CREATE INDEX IF NOT EXISTS idx_events_title_start_url ON events(title, start_date, url);

-- Enable Row Level Security
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- Public read policy - authenticated users can read all events
CREATE POLICY events_read_all ON events
FOR SELECT TO authenticated USING (true);

-- Admin write policy - only admins can insert/update/delete events
CREATE POLICY events_admin_write ON events
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

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_events_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER trigger_events_updated_at
  BEFORE UPDATE ON events
  FOR EACH ROW
  EXECUTE FUNCTION update_events_updated_at();
