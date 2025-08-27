-- NextAuth Tables for Supabase Adapter
-- Run this in your Supabase SQL Editor to create the required tables in public schema

-- Enable uuid generator if needed (Supabase usually has this)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create NextAuth users table
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT,
  email TEXT UNIQUE,
  email_verified TIMESTAMPTZ,
  image TEXT
);

-- Create NextAuth accounts table
CREATE TABLE IF NOT EXISTS public.accounts (
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  provider TEXT NOT NULL,
  provider_account_id TEXT NOT NULL,
  refresh_token TEXT,
  access_token TEXT,
  expires_at BIGINT,
  token_type TEXT,
  scope TEXT,
  id_token TEXT,
  session_state TEXT,
  PRIMARY KEY (provider, provider_account_id)
);

-- Create NextAuth sessions table
CREATE TABLE IF NOT EXISTS public.sessions (
  session_token TEXT PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  expires TIMESTAMPTZ NOT NULL
);

-- Create NextAuth verification_tokens table
CREATE TABLE IF NOT EXISTS public.verification_tokens (
  identifier TEXT NOT NULL,
  token TEXT NOT NULL,
  expires TIMESTAMPTZ NOT NULL,
  PRIMARY KEY (identifier, token)
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_accounts_user_id ON public.accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON public.sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON public.sessions(expires);
CREATE INDEX IF NOT EXISTS idx_verification_tokens_expires ON public.verification_tokens(expires);

-- Grant necessary permissions (adjust as needed for your setup)
-- The service role key will have access to these tables
