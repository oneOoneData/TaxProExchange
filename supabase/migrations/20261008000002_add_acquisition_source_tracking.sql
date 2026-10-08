-- Additive, backward-compatible: new nullable columns only, on both
-- profiles and firms. No drops, no renames, no existing column changes.
--
-- Captures how a signup/conversion found TaxProExchange, alongside (not
-- replacing) the existing member-referral tracking on
-- profiles.referrer_profile_id:
--   - acquisition_source / acquisition_source_detail: the self-reported
--     "How did you hear about us?" answer from the signup/onboarding form.
--   - utm_source / utm_medium / utm_campaign / landing_src: first-touch
--     capture of UTM params and our own ?src= tag from the landing URL,
--     read from a client-set cookie at profile-creation time.
--
-- firms gets the same six columns so a free->paid conversion (Create Firm
-- Account) can carry the original source through to the firm record.

alter table profiles
  add column if not exists acquisition_source text,
  add column if not exists acquisition_source_detail text,
  add column if not exists utm_source text,
  add column if not exists utm_medium text,
  add column if not exists utm_campaign text,
  add column if not exists landing_src text;

alter table firms
  add column if not exists acquisition_source text,
  add column if not exists acquisition_source_detail text,
  add column if not exists utm_source text,
  add column if not exists utm_medium text,
  add column if not exists utm_campaign text,
  add column if not exists landing_src text;

create index if not exists idx_profiles_acquisition_source on profiles (acquisition_source);
create index if not exists idx_firms_acquisition_source on firms (acquisition_source);

comment on column profiles.acquisition_source is
  'Self-reported "How did you hear about us?" answer at signup (dropdown value).';
comment on column profiles.acquisition_source_detail is
  'Free-text detail for acquisition_source, e.g. "Other" text or referrer name.';
comment on column profiles.landing_src is
  'Our own ?src= tag captured first-touch from the landing URL (e.g. "firm-overflow").';
comment on column firms.acquisition_source is
  'Copied from the creating profile at firm-creation time, so paid conversions attribute to a source.';
