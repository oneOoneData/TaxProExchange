-- Additive, backward-compatible: two new tables only. No changes to any
-- existing table.
--
-- Backs the public read-only MCP server for paid firms (see
-- dev-public-mcp-server-2026-10). This is a SEPARATE surface from the
-- internal/admin MCP server (app/api/mcp/route.ts) -- no raw SQL, no
-- writes, no PII. These tables exist only to issue/validate per-firm API
-- keys and to log + rate-limit every query against that surface.

create table if not exists firm_api_keys (
  id uuid primary key default gen_random_uuid(),
  firm_id uuid not null references firms(id) on delete cascade,
  -- SHA-256 hex digest of the actual key. The plaintext key is shown once
  -- on creation and never stored.
  key_hash text not null unique,
  -- First 8 chars of the plaintext key, shown in the UI so an admin can
  -- tell keys apart without re-exposing the secret.
  key_prefix text not null,
  created_by_profile_id uuid references profiles(id),
  created_at timestamp with time zone not null default now(),
  revoked_at timestamp with time zone,
  last_used_at timestamp with time zone
);

-- One active (non-revoked) key per firm for MVP, per the spec's own
-- recommendation. Partial unique index so a revoked-then-reissued firm can
-- still get a fresh row instead of violating uniqueness.
create unique index if not exists idx_firm_api_keys_one_active_per_firm
  on firm_api_keys (firm_id)
  where revoked_at is null;

create index if not exists idx_firm_api_keys_key_hash on firm_api_keys (key_hash);

create table if not exists mcp_public_query_log (
  id bigint primary key generated always as identity,
  firm_id uuid not null references firms(id) on delete cascade,
  api_key_id uuid references firm_api_keys(id) on delete set null,
  tool text not null,
  params jsonb,
  result_count integer,
  created_at timestamp with time zone not null default now()
);

create index if not exists idx_mcp_public_query_log_firm_created
  on mcp_public_query_log (firm_id, created_at desc);
create index if not exists idx_mcp_public_query_log_api_key_created
  on mcp_public_query_log (api_key_id, created_at desc);

-- Server-only tables: the app writes/reads them exclusively via the
-- Supabase service role, same pattern as match_history in
-- 20260711000001_enable_rls_missing_tables.sql. No client-facing policies
-- -- key management goes through app/api routes, never direct client access.
alter table firm_api_keys enable row level security;
alter table mcp_public_query_log enable row level security;

comment on table firm_api_keys is
  'Per-firm API keys for the public read-only MCP server. One active key per firm (MVP). Service-role access only.';
comment on table mcp_public_query_log is
  'Every query against the public MCP server: key, params, result count, timestamp. Used for rate-limiting, auditing, and usage instrumentation.';
