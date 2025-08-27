-- NextAuth Tables for Supabase Adapter (public schema)
-- Run this in your Supabase SQL Editor to create the required tables

create extension if not exists "pgcrypto";

create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  name text,
  email text unique,
  email_verified timestamptz,
  image text
);

create table if not exists public.accounts (
  user_id uuid references public.users(id) on delete cascade,
  type text not null,
  provider text not null,
  provider_account_id text not null,
  refresh_token text,
  access_token text,
  expires_at bigint,
  token_type text,
  scope text,
  id_token text,
  session_state text,
  primary key (provider, provider_account_id)
);

create table if not exists public.sessions (
  session_token text primary key,
  user_id uuid references public.users(id) on delete cascade,
  expires timestamptz not null
);

create table if not exists public.verification_tokens (
  identifier text not null,
  token text not null,
  expires timestamptz not null,
  primary key (identifier, token)
);

-- Add indexes for better performance
create index if not exists idx_accounts_user_id on public.accounts(user_id);
create index if not exists idx_sessions_user_id on public.sessions(user_id);
create index if not exists idx_sessions_expires on public.sessions(expires);
create index if not exists idx_verification_tokens_expires on public.verification_tokens(expires);
