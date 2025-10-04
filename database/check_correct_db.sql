-- Check what tables exist in the correct database
SELECT table_name, table_type 
FROM information_schema.tables 
WHERE table_name LIKE 'profile_%'
ORDER BY table_name;

-- Also check the profiles table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'profiles'
ORDER BY ordinal_position;
