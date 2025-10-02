CREATE TABLE IF NOT EXISTS mentorship_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid UNIQUE NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  is_open_to_mentor boolean NOT NULL DEFAULT false,
  is_seeking_mentor boolean NOT NULL DEFAULT false,
  topics text[] NOT NULL DEFAULT '{}',
  timezone text NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_mentorship_prefs_profile_id ON mentorship_preferences(profile_id);
CREATE INDEX IF NOT EXISTS idx_mentorship_topics_gin ON mentorship_preferences USING gin (topics);

-- RLS
ALTER TABLE mentorship_preferences ENABLE ROW LEVEL SECURITY;

-- Owner can read/write own row
CREATE POLICY mentorship_self_rw ON mentorship_preferences
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.id = mentorship_preferences.profile_id 
    AND p.clerk_id = current_setting('app.clerk_user_id', true)
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.id = mentorship_preferences.profile_id 
    AND p.clerk_id = current_setting('app.clerk_user_id', true)
  )
);

-- Read-only access to others when their profile is listed & verified
CREATE POLICY mentorship_read_public ON mentorship_preferences
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = mentorship_preferences.profile_id
      AND p.is_listed = true
      AND p.visibility_state = 'verified'
  )
);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_mentorship_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER trigger_mentorship_updated_at
  BEFORE UPDATE ON mentorship_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_mentorship_updated_at();
