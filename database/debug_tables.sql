-- Debug script to check what tables exist and their structure

-- List all tables that start with 'profile_'
SELECT table_name, table_type 
FROM information_schema.tables 
WHERE table_name LIKE 'profile_%'
ORDER BY table_name;

-- Check if profile_specializations exists and its structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'profile_specializations'
ORDER BY ordinal_position;

-- Check if profile_locations exists and its structure  
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'profile_locations'
ORDER BY ordinal_position;

-- Check if profile_software exists and its structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'profile_software'
ORDER BY ordinal_position;
