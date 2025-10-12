-- Profile Type Migration
-- Add profile_type to distinguish between tax professionals and firm admins
-- Additive only: no drops, no breaking changes

-- =============================================
-- ADD profile_type to profiles
-- =============================================

-- Add profile_type column (nullable first for backfill)
alter table profiles 
add column if not exists profile_type text;

-- Set default for existing profiles (they're all tax professionals)
update profiles
set profile_type = 'tax_professional'
where profile_type is null;

-- Now add constraint and not null
alter table profiles
alter column profile_type set not null;

alter table profiles
add constraint profiles_profile_type_check 
check (profile_type in ('tax_professional', 'firm_admin'));

-- Set default for new profiles
alter table profiles
alter column profile_type set default 'tax_professional';

-- Add index for filtering
create index if not exists idx_profiles_profile_type on profiles (profile_type);

-- =============================================
-- COMMENTS
-- =============================================
comment on column profiles.profile_type is 
  'Type of profile: tax_professional (appears in directory) or firm_admin (firm management only)';

