-- Firm Workspaces & Trusted Bench Migration
-- Additive only: no drops, no breaking changes to existing tables

-- Ensure extensions exist
create extension if not exists pgcrypto;
create extension if not exists "uuid-ossp";
create extension if not exists pg_trgm;

-- =============================================
-- TABLE: firms
-- =============================================
create table if not exists firms (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  website text,
  size_band text check (size_band in ('1-4', '5-10', '11-25', '26-50', '50+')),
  returns_band text check (returns_band in ('<100', '<1,000', '<5,000', '5,000+')),
  verified boolean not null default false,
  slug text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_firms_name on firms using gin (name gin_trgm_ops);
create index if not exists idx_firms_slug on firms (slug) where slug is not null;

-- =============================================
-- TABLE: firm_members
-- =============================================
create table if not exists firm_members (
  id uuid primary key default gen_random_uuid(),
  firm_id uuid not null references firms(id) on delete cascade,
  profile_id uuid not null references profiles(id) on delete cascade,
  role text not null check (role in ('admin', 'manager', 'member')),
  status text not null check (status in ('active', 'invited', 'removed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (firm_id, profile_id)
);

create index if not exists idx_firm_members_firm on firm_members (firm_id, status);
create index if not exists idx_firm_members_profile on firm_members (profile_id, status);

-- =============================================
-- TABLE: firm_trusted_bench
-- =============================================
create table if not exists firm_trusted_bench (
  id uuid primary key default gen_random_uuid(),
  firm_id uuid not null references firms(id) on delete cascade,
  trusted_profile_id uuid not null references profiles(id) on delete cascade,
  custom_title text,
  categories text[] not null default '{}',
  note text,
  priority int not null default 100,
  visibility_public boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (firm_id, trusted_profile_id)
);

create index if not exists idx_bench_firm_priority on firm_trusted_bench (firm_id, priority);
create index if not exists idx_bench_trusted_profile on firm_trusted_bench (trusted_profile_id);

-- =============================================
-- PREP: messages table (if exists)
-- Add sender_firm_id for future "send as firm" feature
-- =============================================
-- Note: Only add if messages table exists; otherwise skip silently
do $$
begin
  if exists (
    select 1 
    from information_schema.tables 
    where table_schema = 'public' 
    and table_name = 'messages'
  ) then
    alter table messages add column if not exists sender_firm_id uuid references firms(id);
  end if;
exception
  when others then
    -- Silently ignore errors (e.g., if messages table doesn't exist yet)
    null;
end $$;

-- =============================================
-- HELPER FUNCTIONS
-- =============================================

-- Helper: Get profile ID from authenticated user (Clerk-based)
-- Assumes profiles.clerk_user_id exists; adjust if using different auth pattern
create or replace function auth_profile_id() returns uuid
language sql stable security definer as $$
  select id from profiles 
  where clerk_user_id = auth.jwt()->>'sub'
  limit 1
$$;

-- Alternative if using Supabase auth.uid():
-- create or replace function auth_profile_id() returns uuid
-- language sql stable as $$
--   select id from profiles where user_id = auth.uid() limit 1
-- $$;

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================

-- Enable RLS on new tables
alter table firms enable row level security;
alter table firm_members enable row level security;
alter table firm_trusted_bench enable row level security;

-- FIRMS policies
create policy "firms_read_all" 
  on firms for select 
  using (true);

create policy "firms_insert_authenticated" 
  on firms for insert 
  with check (auth.jwt() is not null);

create policy "firms_update_admin_manager" 
  on firms for update 
  using (
    exists (
      select 1 from firm_members fm
      where fm.firm_id = firms.id
        and fm.profile_id = auth_profile_id()
        and fm.status = 'active'
        and fm.role in ('admin', 'manager')
    )
  );

create policy "firms_delete_admin_only" 
  on firms for delete 
  using (
    exists (
      select 1 from firm_members fm
      where fm.firm_id = firms.id
        and fm.profile_id = auth_profile_id()
        and fm.status = 'active'
        and fm.role = 'admin'
    )
  );

-- FIRM_MEMBERS policies
create policy "firm_members_select_member" 
  on firm_members for select 
  using (
    exists (
      select 1 from firm_members fm
      where fm.firm_id = firm_members.firm_id
        and fm.profile_id = auth_profile_id()
        and fm.status = 'active'
    )
  );

create policy "firm_members_insert_admin_manager" 
  on firm_members for insert 
  with check (
    exists (
      select 1 from firm_members fm
      where fm.firm_id = firm_members.firm_id
        and fm.profile_id = auth_profile_id()
        and fm.status = 'active'
        and fm.role in ('admin', 'manager')
    )
  );

create policy "firm_members_update_admin_manager" 
  on firm_members for update 
  using (
    exists (
      select 1 from firm_members fm
      where fm.firm_id = firm_members.firm_id
        and fm.profile_id = auth_profile_id()
        and fm.status = 'active'
        and fm.role in ('admin', 'manager')
    )
  );

create policy "firm_members_delete_admin_manager" 
  on firm_members for delete 
  using (
    exists (
      select 1 from firm_members fm
      where fm.firm_id = firm_members.firm_id
        and fm.profile_id = auth_profile_id()
        and fm.status = 'active'
        and fm.role in ('admin', 'manager')
    )
  );

-- FIRM_TRUSTED_BENCH policies
-- Read: firm members only (public reads via API with explicit checks)
create policy "bench_select_member" 
  on firm_trusted_bench for select 
  using (
    exists (
      select 1 from firm_members fm
      where fm.firm_id = firm_trusted_bench.firm_id
        and fm.profile_id = auth_profile_id()
        and fm.status = 'active'
    )
  );

create policy "bench_insert_member" 
  on firm_trusted_bench for insert 
  with check (
    exists (
      select 1 from firm_members fm
      where fm.firm_id = firm_trusted_bench.firm_id
        and fm.profile_id = auth_profile_id()
        and fm.status = 'active'
    )
  );

create policy "bench_update_member" 
  on firm_trusted_bench for update 
  using (
    exists (
      select 1 from firm_members fm
      where fm.firm_id = firm_trusted_bench.firm_id
        and fm.profile_id = auth_profile_id()
        and fm.status = 'active'
    )
  );

create policy "bench_delete_member" 
  on firm_trusted_bench for delete 
  using (
    exists (
      select 1 from firm_members fm
      where fm.firm_id = firm_trusted_bench.firm_id
        and fm.profile_id = auth_profile_id()
        and fm.status = 'active'
    )
  );

-- =============================================
-- TRIGGERS: updated_at auto-update
-- =============================================

create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger firms_updated_at before update on firms
  for each row execute function update_updated_at_column();

create trigger firm_members_updated_at before update on firm_members
  for each row execute function update_updated_at_column();

create trigger firm_trusted_bench_updated_at before update on firm_trusted_bench
  for each row execute function update_updated_at_column();

