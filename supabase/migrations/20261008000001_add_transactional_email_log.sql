-- Additive, backward-compatible: new table only, no changes to existing tables.
--
-- `email_log` (database/2025-01-15_email_log_table.sql) is shaped for batch
-- marketing sends (one row per campaign, with aggregate recipients[] /
-- emails_sent / emails_failed counters) and is not a fit for per-message
-- transactional records. This table logs every individual send that goes
-- through lib/email.ts's sendEmail() -- application notifications, job
-- alerts, connection/verification emails, etc. -- so they're queryable.
create table if not exists transactional_email_log (
  id bigint primary key generated always as identity,
  category text not null default 'uncategorized',
  to_email text not null,
  subject text not null,
  resend_id text,
  status text not null default 'sent' check (status in ('sent', 'failed')),
  error text,
  metadata jsonb,
  created_at timestamp with time zone not null default now()
);

create index if not exists idx_transactional_email_log_created_at
  on transactional_email_log (created_at desc);

create index if not exists idx_transactional_email_log_category
  on transactional_email_log (category);

create index if not exists idx_transactional_email_log_to_email
  on transactional_email_log (to_email);

-- Server-only table: the app writes/reads it exclusively via the Supabase
-- service role (supabaseService()), same pattern as match_history in
-- 20260711000001_enable_rls_missing_tables.sql. No client-facing policies.
alter table transactional_email_log enable row level security;

comment on table transactional_email_log is
  'Per-message log of transactional emails sent via lib/email.ts sendEmail(). Service-role access only.';
