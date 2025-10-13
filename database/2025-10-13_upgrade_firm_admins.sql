-- Upgrade Firm Admin Profiles Migration
-- Allows firm admins to participate fully in the platform while staying out of search
-- Date: 2025-10-13

-- =============================================
-- UPGRADE FIRM ADMIN PROFILES
-- =============================================

-- Change firm_admin profiles from 'hidden' to 'verified'
-- They remain unlisted (is_listed = false) so they don't appear in search
-- But they can now be viewed, receive connections, and participate fully
UPDATE profiles
SET 
  visibility_state = 'verified',
  updated_at = now()
WHERE 
  profile_type = 'firm_admin'
  AND visibility_state = 'hidden';

-- =============================================
-- COMMENTS
-- =============================================
COMMENT ON COLUMN profiles.profile_type IS 
  'Type of profile: tax_professional (appears in directory) or firm_admin (verified but unlisted - can participate without cluttering search)';

-- =============================================
-- VERIFICATION
-- =============================================
-- Show count of upgraded profiles
SELECT 
  profile_type,
  visibility_state,
  is_listed,
  COUNT(*) as count
FROM profiles
WHERE profile_type = 'firm_admin'
GROUP BY profile_type, visibility_state, is_listed;

