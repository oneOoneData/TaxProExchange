-- =========================================
-- RLS Hardening Migration - DOWN (Rollback)
-- Reverts RLS policies to previous permissive state
-- =========================================

-- =========================================
-- SAFETY: grants & schema usage
-- =========================================
revoke all on all tables in schema public from anon, authenticated;
grant usage on schema public to anon, authenticated;

-- =========================================
-- 1) DISABLE RLS ON PUBLIC READ-ONLY TABLES
-- =========================================
alter table if exists public.locations disable row level security;
alter table if exists public.specializations disable row level security;
alter table if exists public.specialization_groups disable row level security;

-- =========================================
-- 2) RESTORE AUTH TABLES TO ORIGINAL STATE
-- =========================================
-- Remove the blocking policies we added and disable RLS
drop policy if exists no_client_access_users on public.users;
drop policy if exists no_client_access_accounts on public.accounts;
drop policy if exists no_client_access_sessions on public.sessions;
drop policy if exists no_client_access_verification_tokens on public.verification_tokens;

alter table if exists public.users disable row level security;
alter table if exists public.accounts disable row level security;
alter table if exists public.sessions disable row level security;
alter table if exists public.verification_tokens disable row level security;

-- =========================================
-- 3) DISABLE RLS ON LICENSES TABLE
-- =========================================
alter table if exists public.licenses disable row level security;

-- =========================================
-- 4) PROFILE RELATIONSHIP TABLES (keep RLS enabled, just remove our policies)
-- =========================================
-- These tables already had RLS enabled, we just added policies
-- We'll remove our policies but keep RLS enabled

-- =========================================
-- 5) RESTORE CONNECTIONS TABLE (keep RLS enabled, remove our policies)
-- =========================================
-- Remove the blocking policy we added
drop policy if exists no_client_access_connections on public.connections;
-- Keep RLS enabled and original policies

-- =========================================
-- 6) RESTORE JOBS & JOB APPLICATIONS (keep RLS enabled, remove our policies)
-- =========================================
-- Remove our policies but keep RLS enabled (they already had RLS)
-- Jobs and job_applications already had RLS enabled

-- =========================================
-- 7) DROP ALL POLICIES WE CREATED
-- =========================================

-- Public read-only table policies
drop policy if exists anon_can_read_locations on public.locations;
drop policy if exists anon_can_read_specializations on public.specializations;
drop policy if exists anon_can_read_specialization_groups on public.specialization_groups;

-- License ownership policies
drop policy if exists owners_select_licenses on public.licenses;
drop policy if exists owners_insert_licenses on public.licenses;
drop policy if exists owners_update_licenses on public.licenses;
drop policy if exists owners_delete_licenses on public.licenses;

-- Profile specializations policies
drop policy if exists owners_select_profile_specializations on public.profile_specializations;
drop policy if exists owners_insert_profile_specializations on public.profile_specializations;
drop policy if exists owners_update_profile_specializations on public.profile_specializations;
drop policy if exists owners_delete_profile_specializations on public.profile_specializations;

-- Profile locations policies
drop policy if exists owners_select_profile_locations on public.profile_locations;
drop policy if exists owners_insert_profile_locations on public.profile_locations;
drop policy if exists owners_update_profile_locations on public.profile_locations;
drop policy if exists owners_delete_profile_locations on public.profile_locations;

-- Jobs and job applications policies
drop policy if exists jobs_read_all on public.jobs;
drop policy if exists jobs_own_crud on public.jobs;
drop policy if exists job_applications_own on public.job_applications;

-- =========================================
-- 8) DROP ADMIN FUNCTION IF CREATED
-- =========================================
drop function if exists public.is_app_admin();

-- =========================================
-- NOTE: This rollback restores the database to a permissive state
-- where RLS is disabled on most tables. The original policies from
-- schema.sql (profiles, users, waitlist) will remain in place.
-- =========================================
