-- Bookkeeper v1 (core discovery) Migration
-- Adds: profiles.professional_roles, certifications table, industries catalog
-- Additive only: no drops, no breaking changes to existing columns/tables.

-- =============================================
-- 1. professional_roles on profiles
-- =============================================
-- Orthogonal to credential_type (the specific credential/license) and
-- profile_type (tax_professional vs firm_admin). Lets a profile be tagged
-- as tax_pro, bookkeeper, or both.

alter table profiles
add column if not exists professional_roles text[];

update profiles
set professional_roles = '{tax_pro}'
where professional_roles is null;

alter table profiles
alter column professional_roles set not null;

alter table profiles
alter column professional_roles set default '{tax_pro}';

alter table profiles
add constraint profiles_professional_roles_check
  check (professional_roles <@ array['tax_pro','bookkeeper']::text[]
         and array_length(professional_roles, 1) >= 1);

create index if not exists idx_profiles_professional_roles
  on profiles using gin (professional_roles);

comment on column profiles.professional_roles is
  'Roles this profile is listed under for directory discovery: tax_pro and/or bookkeeper. Orthogonal to profile_type and credential_type.';

-- =============================================
-- 2. certifications table
-- =============================================
-- Lightweight, decoupled from the state-board-shaped `licenses` table.
-- QuickBooks ProAdvisor / Xero Certified / AIPB / NACPB don't have a state
-- or license number. status defaults to 'self_reported' in v1 -- no admin
-- review UI yet, but the shape anticipates one.

create table if not exists certifications (
  id uuid primary key default uuid_generate_v4(),
  profile_id uuid not null references profiles(id) on delete cascade,
  kind text not null check (kind in (
    'QBO_PROADVISOR', 'QBO_PROADVISOR_ADVANCED', 'XERO_CERTIFIED',
    'AIPB_CB', 'NACPB_CPB', 'OTHER'
  )),
  issuer text,
  cert_number text,
  expires_on date,
  notes text,
  status text not null default 'self_reported' check (status in (
    'self_reported', 'pending_review', 'verified', 'rejected'
  )),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (profile_id, kind)
);

create index if not exists idx_certifications_profile_id
  on certifications (profile_id);

comment on table certifications is
  'Bookkeeping/software certifications (QBO ProAdvisor, Xero Certified, AIPB, NACPB, etc.), decoupled from the state-board-oriented licenses table. status defaults to self_reported; admin review workflow is future work. No RLS: app access goes through the service role, same as profiles/licenses/profile_specializations today -- protect cert_number via explicit column selection in queries, never select(*) on the public profile route.';

-- =============================================
-- 3. industries catalog
-- =============================================
-- Reusable by tax pros too, not bookkeeper-only. Same normalized pattern
-- as specializations/profile_specializations: profile_industries is what
-- search filters against; profiles.industries is the denormalized display
-- copy kept in sync by the API layer.

create table if not exists industries (
  id uuid primary key default uuid_generate_v4(),
  slug text not null unique,
  label text not null,
  created_at timestamptz not null default now()
);

create table if not exists profile_industries (
  id uuid primary key default uuid_generate_v4(),
  profile_id uuid not null references profiles(id) on delete cascade,
  industry_slug text not null references industries(slug),
  created_at timestamptz not null default now(),
  unique (profile_id, industry_slug)
);

create index if not exists idx_profile_industries_profile_id
  on profile_industries (profile_id);
create index if not exists idx_profile_industries_slug
  on profile_industries (industry_slug);

alter table profiles
add column if not exists industries text[] not null default '{}';

comment on column profiles.industries is
  'Denormalized copy of profile_industries for display/search-result payloads. profile_industries is the source of truth for filtering.';

insert into industries (slug, label) values
  ('ecommerce', 'E-commerce'),
  ('real_estate', 'Real Estate'),
  ('construction', 'Construction & Contractors'),
  ('restaurants_hospitality', 'Restaurants & Hospitality'),
  ('healthcare', 'Healthcare & Medical Practices'),
  ('nonprofits', 'Nonprofits'),
  ('professional_services', 'Professional Services'),
  ('saas_tech', 'SaaS & Tech Startups'),
  ('retail', 'Retail'),
  ('trucking_logistics', 'Trucking & Logistics'),
  ('agriculture', 'Agriculture'),
  ('legal', 'Legal / Law Firms'),
  ('manufacturing', 'Manufacturing')
on conflict (slug) do nothing;

-- =============================================
-- ROLLBACK (manual, if ever needed -- all changes above are additive)
-- =============================================
-- drop table if exists profile_industries, industries, certifications;
-- alter table profiles drop column if exists professional_roles;
-- alter table profiles drop column if exists industries;
