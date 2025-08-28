-- Clear All User Data Script
-- WARNING: This will delete ALL profiles and related data
-- Run this in your Supabase SQL editor

-- Clear all tables in dependency order
TRUNCATE TABLE verification_requests CASCADE;
TRUNCATE TABLE profile_locations CASCADE;
TRUNCATE TABLE profile_specializations CASCADE;
TRUNCATE TABLE profiles CASCADE;

-- Reset any auto-increment sequences
-- (Uncomment if you have sequences)
-- ALTER SEQUENCE profiles_id_seq RESTART WITH 1;
-- ALTER SEQUENCE verification_requests_id_seq RESTART WITH 1;

-- Verify tables are empty
SELECT 
  'profiles' as table_name, COUNT(*) as row_count FROM profiles
UNION ALL
SELECT 
  'profile_specializations' as table_name, COUNT(*) as row_count FROM profile_specializations
UNION ALL
SELECT 
  'profile_locations' as table_name, COUNT(*) as row_count FROM profile_locations
UNION ALL
SELECT 
  'verification_requests' as table_name, COUNT(*) as row_count FROM verification_requests;

-- Output should show 0 rows for all tables
