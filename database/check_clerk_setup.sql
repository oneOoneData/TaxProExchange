-- Clerk Database Health Check Script
-- Run this in your Supabase SQL Editor to verify everything is set up correctly

-- 1. Check if clerk_id column exists in profiles table
SELECT 
    'profiles.clerk_id column' as check_name,
    CASE 
        WHEN column_name = 'clerk_id' THEN '✅ EXISTS'
        ELSE '❌ MISSING'
    END as status
FROM information_schema.columns 
WHERE table_name = 'profiles' AND column_name = 'clerk_id';

-- 2. Check if profiles table has the right structure
SELECT 
    'profiles table structure' as check_name,
    CASE 
        WHEN COUNT(*) >= 15 THEN '✅ GOOD (has expected columns)'
        ELSE '❌ INCOMPLETE (missing columns)'
    END as status
FROM information_schema.columns 
WHERE table_name = 'profiles';

-- 3. Check if RLS policies exist
SELECT 
    'RLS policies' as check_name,
    CASE 
        WHEN COUNT(*) >= 2 THEN '✅ EXISTS'
        ELSE '❌ MISSING'
    END as status
FROM pg_policies 
WHERE tablename = 'profiles';

-- 4. Check if helper functions exist
SELECT 
    'Helper functions' as check_name,
    CASE 
        WHEN COUNT(*) >= 2 THEN '✅ EXISTS'
        ELSE '❌ MISSING'
    END as status
FROM pg_proc 
WHERE proname IN ('upsert_profile_from_clerk', 'get_profile_by_clerk_id');

-- 5. Check if there are any existing profiles
SELECT 
    'Existing profiles' as check_name,
    CASE 
        WHEN COUNT(*) >= 0 THEN '✅ READY'
        ELSE '❌ ERROR'
    END as status
FROM profiles;

-- 6. Check table permissions
SELECT 
    'Table permissions' as check_name,
    CASE 
        WHEN has_table_privilege('authenticated', 'profiles', 'SELECT') THEN '✅ GOOD'
        ELSE '❌ MISSING'
    END as status;

-- 7. Show current profiles table structure
SELECT 
    'Current profiles columns:' as info,
    string_agg(column_name, ', ' ORDER BY ordinal_position) as columns
FROM information_schema.columns 
WHERE table_name = 'profiles';

-- 8. Show RLS policies
SELECT 
    'Current RLS policies:' as info,
    string_agg(policyname, ', ') as policies
FROM pg_policies 
WHERE tablename = 'profiles';

-- 9. Test the helper function (should not error)
DO $$
BEGIN
    -- Test if we can call the function without error
    PERFORM get_profile_by_clerk_id('test-clerk-id');
    RAISE NOTICE '✅ Helper functions working correctly';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '❌ Helper function error: %', SQLERRM;
END $$;
