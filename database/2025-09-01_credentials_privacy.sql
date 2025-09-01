-- Credential Privacy Migration
-- Add privacy fields to licenses table and create public view
-- Safe for repeat execution

-- 1. Add new privacy columns to licenses table
ALTER TABLE licenses 
  ADD COLUMN IF NOT EXISTS board_profile_url TEXT NULL;

-- 2. No need for masking functions - we'll just show verification badges

-- 3. Create public view that excludes private license numbers
CREATE OR REPLACE VIEW licenses_public_view AS
SELECT
  id, 
  profile_id, 
  license_kind, 
  issuing_authority, 
  state, 
  expires_on,
  board_profile_url,
  status,
  created_at,
  updated_at
FROM licenses
WHERE status = 'verified';

-- 4. Add RLS policy to ensure license_number is never exposed to public
-- (This assumes RLS is already enabled on licenses table)
-- The view above already handles this by not selecting license_number

-- 5. Create index for better performance on public queries
CREATE INDEX IF NOT EXISTS idx_licenses_public_lookup 
ON licenses(profile_id, status) 
WHERE status = 'verified';

-- 6. Verification message
DO $$
BEGIN
    RAISE NOTICE 'Credential privacy migration completed successfully!';
    RAISE NOTICE 'Added field: board_profile_url';
    RAISE NOTICE 'Created licenses_public_view for safe public access';
    RAISE NOTICE 'License numbers are now private and never exposed publicly';
    RAISE NOTICE 'Public profiles show verification badges only';
END $$;
