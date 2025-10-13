-- Enable Firm Admin Search Toggle
-- Allow firm admins to opt into search directory via is_listed field
-- Date: 2025-10-13

-- =============================================
-- ENABLE KELLAN'S PROFILE IN SEARCH
-- =============================================

-- Enable is_listed for Kellan Johnson (paying customer who wants to be discoverable)
UPDATE profiles
SET 
  is_listed = true,
  updated_at = now()
WHERE 
  id = '7b3f4566-58ff-4391-b8f5-aaeacc52a189';

-- =============================================
-- NOTES
-- =============================================

-- Previous behavior: Firm admins were excluded from search via hardcoded filter
-- New behavior: All users (tax_professional AND firm_admin) can control their
--               search visibility via the is_listed checkbox in profile settings

-- UI location: Profile Edit > Visibility & Availability section
-- Checkbox: "Include my profile in the searchable directory"

-- Default values:
-- - tax_professional: is_listed = true (default searchable)
-- - firm_admin: is_listed = false (default private, can opt-in)

-- =============================================
-- VERIFICATION
-- =============================================

-- Check Kellan's profile
SELECT 
  id,
  first_name,
  last_name,
  profile_type,
  is_listed,
  visibility_state
FROM profiles
WHERE id = '7b3f4566-58ff-4391-b8f5-aaeacc52a189';

-- Count searchable profiles by type
SELECT 
  profile_type,
  is_listed,
  COUNT(*) as count
FROM profiles
WHERE visibility_state = 'verified'
GROUP BY profile_type, is_listed
ORDER BY profile_type, is_listed;

