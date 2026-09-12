-- Fix profiles.credential_type CHECK constraint
--
-- Discovered live (not present in any tracked migration file) while testing
-- the bookkeeper-v1 feature: profiles_credential_type_check only allowed
-- CPA, EA, CTEC, OR_Tax_Preparer, OR_Tax_Consultant, Student,
-- "Tax Lawyer (JD)", "PTIN Only", Other -- missing "Accountant" and
-- "Financial Planner" (already in CredentialTypeEnum / the UI dropdown
-- before this feature) AND "Bookkeeper" (new in this feature). Anyone
-- selecting Accountant or Financial Planner in onboarding has presumably
-- been hitting this same constraint violation already.
--
-- This resyncs the constraint to match lib/validations/zodSchemas.ts's
-- CredentialTypeEnum exactly.

alter table profiles drop constraint if exists profiles_credential_type_check;

alter table profiles add constraint profiles_credential_type_check
  check (credential_type = ANY (ARRAY[
    'CPA', 'EA', 'CTEC', 'OR_Tax_Preparer', 'OR_Tax_Consultant',
    'Tax Lawyer (JD)', 'Accountant', 'Financial Planner', 'Bookkeeper',
    'PTIN Only', 'Student', 'Other'
  ]::text[]));

-- Rollback: restore the prior (already-stale) constraint if ever needed:
-- alter table profiles drop constraint profiles_credential_type_check;
-- alter table profiles add constraint profiles_credential_type_check
--   check (credential_type = ANY (ARRAY['CPA','EA','CTEC','OR_Tax_Preparer',
--     'OR_Tax_Consultant','Student','Tax Lawyer (JD)','PTIN Only','Other']::text[]));
