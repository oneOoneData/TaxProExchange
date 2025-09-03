-- =========================================
-- RLS Hardening Migration - TEST SCRIPT
-- Run this after applying the migration to verify it works correctly
-- =========================================

-- =========================================
-- TEST 1: Anonymous can read public reference data
-- =========================================
-- These should work (return data)
select 'TEST 1a: Anonymous can read locations' as test_name;
select count(*) as location_count from public.locations;

select 'TEST 1b: Anonymous can read specializations' as test_name;
select count(*) as specialization_count from public.specializations;

select 'TEST 1c: Anonymous can read specialization_groups' as test_name;
select count(*) as group_count from public.specialization_groups;

-- =========================================
-- TEST 2: Anonymous cannot access sensitive data
-- =========================================
-- These should fail with permission denied
select 'TEST 2a: Anonymous cannot read users' as test_name;
select count(*) from public.users; -- Should fail

select 'TEST 2b: Anonymous cannot read accounts' as test_name;
select count(*) from public.accounts; -- Should fail

select 'TEST 2c: Anonymous cannot read sessions' as test_name;
select count(*) from public.sessions; -- Should fail

select 'TEST 2d: Anonymous cannot read verification_tokens' as test_name;
select count(*) from public.verification_tokens; -- Should fail

select 'TEST 2e: Anonymous cannot read licenses' as test_name;
select count(*) from public.licenses; -- Should fail

select 'TEST 2f: Anonymous cannot read profile_specializations' as test_name;
select count(*) from public.profile_specializations; -- Should fail

select 'TEST 2g: Anonymous cannot read profile_locations' as test_name;
select count(*) from public.profile_locations; -- Should fail

select 'TEST 2h: Anonymous cannot read connections' as test_name;
select count(*) from public.connections; -- Should fail

select 'TEST 2i: Anonymous cannot read jobs' as test_name;
select count(*) from public.jobs; -- Should fail

select 'TEST 2j: Anonymous cannot read job_applications' as test_name;
select count(*) from public.job_applications; -- Should fail

-- =========================================
-- TEST 3: Authenticated user can only see own data
-- =========================================
-- Simulate authenticated user (replace with real user_id from your profiles table)
select 'TEST 3: Setting up authenticated user context' as test_name;

-- First, let's see what profiles exist
select 'Available profiles:' as info;
select id, user_id, first_name, last_name from public.profiles limit 5;

-- Set a test user context (replace the UUID with a real user_id from above)
-- select set_config('request.jwt.claims', '{"role":"authenticated","sub":"REPLACE_WITH_REAL_USER_ID"}', true);

-- Test that authenticated user can only see their own licenses
-- select 'TEST 3a: Authenticated user can see own licenses' as test_name;
-- select lic.* from public.licenses lic
-- join public.profiles p on p.id = lic.profile_id
-- where p.user_id = auth.uid()
-- limit 5;

-- =========================================
-- TEST 4: Verify RLS is enabled on all tables
-- =========================================
select 'TEST 4: Checking RLS status on all tables' as test_name;
select 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
from pg_tables 
where schemaname = 'public' 
    and tablename in (
        'users', 'accounts', 'sessions', 'verification_tokens', 'profiles', 
        'specializations', 'specialization_groups', 'locations', 'licenses', 
        'profile_specializations', 'profile_locations', 'connections', 
        'jobs', 'job_applications', 'audits', 'jobs_milestones', 
        'notification_prefs', 'profile_software', 'pros_saved_searches', 
        'reviews_firm_by_preparer', 'reviews_preparer_by_firm'
    )
order by tablename;

-- =========================================
-- TEST 5: Check policies exist
-- =========================================
select 'TEST 5: Checking policies exist' as test_name;
select 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
from pg_policies 
where schemaname = 'public'
order by tablename, policyname;

-- =========================================
-- TEST 6: Jobs functionality (authenticated users can read all jobs)
-- =========================================
select 'TEST 6: Testing jobs access' as test_name;

-- This should work for authenticated users (read all jobs)
-- select count(*) from public.jobs;

-- This should fail for anonymous users
-- select count(*) from public.jobs; -- Should fail for anon

-- =========================================
-- ROLLBACK TEST (if needed)
-- =========================================
-- If any tests fail, you can rollback using:
-- psql -h your-host -U postgres -d your-db -f database/migrations/2025-09-02_rls_hardening.down.sql

-- =========================================
-- NOTES
-- =========================================
-- 1. Replace 'REPLACE_WITH_REAL_USER_ID' with an actual user_id from your profiles table
-- 2. Uncomment the authenticated user tests after setting a real user context
-- 3. The server using service_role key will bypass all RLS policies
-- 4. If tests fail, check that your profiles table has the expected structure
-- 5. Make sure your auth.uid() function is working correctly
