-- =========================================
-- RLS Hardening Migration - UP
-- Enables RLS on all tables with appropriate policies
-- =========================================

-- =========================================
-- SAFETY: grants & schema usage
-- =========================================
revoke all on all tables in schema public from anon, authenticated;
grant usage on schema public to anon, authenticated;

-- =========================================
-- 1) PUBLIC READ-ONLY TABLES (keep UI working)
-- locations, specializations, specialization_groups
-- =========================================
alter table if exists public.locations enable row level security;
drop policy if exists anon_can_read_locations on public.locations;
create policy anon_can_read_locations
  on public.locations for select
  to anon, authenticated
  using (true);

alter table if exists public.specializations enable row level security;
drop policy if exists anon_can_read_specializations on public.specializations;
create policy anon_can_read_specializations
  on public.specializations for select
  to anon, authenticated
  using (true);

alter table if exists public.specialization_groups enable row level security;
drop policy if exists anon_can_read_specialization_groups on public.specialization_groups;
create policy anon_can_read_specialization_groups
  on public.specialization_groups for select
  to anon, authenticated
  using (true);

-- =========================================
-- 2) SENSITIVE AUTH/FRAMEWORK TABLES (block clients entirely)
-- users, accounts, sessions, verification_tokens (server with service_role still bypasses RLS)
-- =========================================
-- Users table (currently RLS disabled)
alter table if exists public.users enable row level security;
drop policy if exists no_client_access_users on public.users;
create policy no_client_access_users on public.users for all
  to anon, authenticated using (false) with check (false);

-- Accounts table (currently RLS disabled)
alter table if exists public.accounts enable row level security;
drop policy if exists no_client_access_accounts on public.accounts;
create policy no_client_access_accounts on public.accounts for all
  to anon, authenticated using (false) with check (false);

-- Sessions table (currently RLS disabled)
alter table if exists public.sessions enable row level security;
drop policy if exists no_client_access_sessions on public.sessions;
create policy no_client_access_sessions on public.sessions for all
  to anon, authenticated using (false) with check (false);

-- Verification tokens table (currently RLS disabled)
alter table if exists public.verification_tokens enable row level security;
drop policy if exists no_client_access_verification_tokens on public.verification_tokens;
create policy no_client_access_verification_tokens on public.verification_tokens for all
  to anon, authenticated using (false) with check (false);

-- =========================================
-- 3) APP DATA WITH OWNERSHIP (licenses)
-- Ownership via profiles.user_id = auth.uid()
-- licenses.profile_id -> profiles.id
-- =========================================
alter table if exists public.licenses enable row level security;

-- Select: owner may read their own license rows
drop policy if exists owners_select_licenses on public.licenses;
create policy owners_select_licenses
  on public.licenses for select
  to authenticated
  using (
    exists (
      select 1
      from public.profiles p
      where p.id = licenses.profile_id
        and p.user_id = auth.uid()
    )
  );

-- Insert: only into own profile's licenses
drop policy if exists owners_insert_licenses on public.licenses;
create policy owners_insert_licenses
  on public.licenses for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.profiles p
      where p.id = licenses.profile_id
        and p.user_id = auth.uid()
    )
  );

-- Update: only own licenses
drop policy if exists owners_update_licenses on public.licenses;
create policy owners_update_licenses
  on public.licenses for update
  to authenticated
  using (
    exists (
      select 1
      from public.profiles p
      where p.id = licenses.profile_id
        and p.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.profiles p
      where p.id = licenses.profile_id
        and p.user_id = auth.uid()
    )
  );

-- Delete: only own licenses
drop policy if exists owners_delete_licenses on public.licenses;
create policy owners_delete_licenses
  on public.licenses for delete
  to authenticated
  using (
    exists (
      select 1
      from public.profiles p
      where p.id = licenses.profile_id
        and p.user_id = auth.uid()
    )
  );

-- =========================================
-- 4) PROFILE SPECIALIZATIONS & LOCATIONS (many-to-many tables)
-- These already have RLS enabled, but we need to ensure proper policies
-- =========================================
-- Profile specializations already has RLS enabled, just ensure policies are correct

-- Select: owner may read their own profile specializations
drop policy if exists owners_select_profile_specializations on public.profile_specializations;
create policy owners_select_profile_specializations
  on public.profile_specializations for select
  to authenticated
  using (
    exists (
      select 1
      from public.profiles p
      where p.id = profile_specializations.profile_id
        and p.user_id = auth.uid()
    )
  );

-- Insert: only into own profile's specializations
drop policy if exists owners_insert_profile_specializations on public.profile_specializations;
create policy owners_insert_profile_specializations
  on public.profile_specializations for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.profiles p
      where p.id = profile_specializations.profile_id
        and p.user_id = auth.uid()
    )
  );

-- Update: only own profile specializations
drop policy if exists owners_update_profile_specializations on public.profile_specializations;
create policy owners_update_profile_specializations
  on public.profile_specializations for update
  to authenticated
  using (
    exists (
      select 1
      from public.profiles p
      where p.id = profile_specializations.profile_id
        and p.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.profiles p
      where p.id = profile_specializations.profile_id
        and p.user_id = auth.uid()
    )
  );

-- Delete: only own profile specializations
drop policy if exists owners_delete_profile_specializations on public.profile_specializations;
create policy owners_delete_profile_specializations
  on public.profile_specializations for delete
  to authenticated
  using (
    exists (
      select 1
      from public.profiles p
      where p.id = profile_specializations.profile_id
        and p.user_id = auth.uid()
    )
  );

-- Profile locations already has RLS enabled, just ensure policies are correct

-- Select: owner may read their own profile locations
drop policy if exists owners_select_profile_locations on public.profile_locations;
create policy owners_select_profile_locations
  on public.profile_locations for select
  to authenticated
  using (
    exists (
      select 1
      from public.profiles p
      where p.id = profile_locations.profile_id
        and p.user_id = auth.uid()
    )
  );

-- Insert: only into own profile's locations
drop policy if exists owners_insert_profile_locations on public.profile_locations;
create policy owners_insert_profile_locations
  on public.profile_locations for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.profiles p
      where p.id = profile_locations.profile_id
        and p.user_id = auth.uid()
    )
  );

-- Update: only own profile locations
drop policy if exists owners_update_profile_locations on public.profile_locations;
create policy owners_update_profile_locations
  on public.profile_locations for update
  to authenticated
  using (
    exists (
      select 1
      from public.profiles p
      where p.id = profile_locations.profile_id
        and p.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.profiles p
      where p.id = profile_locations.profile_id
        and p.user_id = auth.uid()
    )
  );

-- Delete: only own profile locations
drop policy if exists owners_delete_profile_locations on public.profile_locations;
create policy owners_delete_profile_locations
  on public.profile_locations for delete
  to authenticated
  using (
    exists (
      select 1
      from public.profiles p
      where p.id = profile_locations.profile_id
        and p.user_id = auth.uid()
    )
  );

-- =========================================
-- 5) WAITLIST TABLE REMOVED - SKIPPING
-- =========================================

-- =========================================
-- 6) CONNECTIONS TABLE (already has RLS enabled)
-- =========================================
-- Connections table already has RLS enabled
-- Just ensure anon can't access it
drop policy if exists no_client_access_connections on public.connections;
create policy no_client_access_connections on public.connections for all
  to anon using (false) with check (false);

-- =========================================
-- 7) JOBS & JOB APPLICATIONS (already have RLS enabled)
-- =========================================
-- Jobs table already has RLS enabled
-- Jobs: authenticated users can read all, but only create/update their own
drop policy if exists jobs_read_all on public.jobs;
create policy jobs_read_all on public.jobs for select
  to authenticated using (true);

drop policy if exists jobs_own_crud on public.jobs;
create policy jobs_own_crud on public.jobs for all
  to authenticated
  using (created_by = clerk_user_id())
  with check (created_by = clerk_user_id());

-- Job applications table already has RLS enabled
-- Job applications: users can only see their own applications
drop policy if exists job_applications_own on public.job_applications;
create policy job_applications_own on public.job_applications for all
  to authenticated
  using (applicant_user_id = clerk_user_id())
  with check (applicant_user_id = clerk_user_id());

-- =========================================
-- 8) ADMIN BYPASS FUNCTION (optional)
-- Uncomment if you need admin bypass functionality
-- =========================================
-- create or replace function public.is_app_admin() returns boolean language sql stable as $$
--   select coalesce( (select true from public.profiles pr where pr.user_id = auth.uid() and pr.is_admin = true), false);
-- $$;

-- NOTE: We are NOT using FORCE ROW LEVEL SECURITY yet to keep rollout safe.
