-- Add enrichment fields to profiles table
-- Migration: 20251009_add_enrichment_fields.sql

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS team_size_verified text,
  ADD COLUMN IF NOT EXISTS team_page_url text,
  ADD COLUMN IF NOT EXISTS specialty_verified text,
  ADD COLUMN IF NOT EXISTS confidence_level text CHECK (confidence_level IN ('High','Medium','Low')),
  ADD COLUMN IF NOT EXISTS last_verified_on date;

-- Note: Skipping unique index on website_url due to existing duplicates in database
-- If you want to enforce uniqueness, first clean up duplicates:
-- SELECT website_url, COUNT(*) FROM profiles WHERE website_url IS NOT NULL GROUP BY website_url HAVING COUNT(*) > 1;
-- Then uncomment and run:
-- CREATE UNIQUE INDEX IF NOT EXISTS profiles_website_unique 
--   ON profiles (lower(website_url)) 
--   WHERE website_url IS NOT NULL AND website_url != '';

-- Add comments for documentation
COMMENT ON COLUMN profiles.team_size_verified IS 'Number of team members discovered from firm website';
COMMENT ON COLUMN profiles.team_page_url IS 'URL of team/about page used for verification';
COMMENT ON COLUMN profiles.specialty_verified IS 'Specialties extracted from firm website';
COMMENT ON COLUMN profiles.confidence_level IS 'Enrichment confidence: High, Medium, or Low';
COMMENT ON COLUMN profiles.last_verified_on IS 'Date of last website enrichment run';

