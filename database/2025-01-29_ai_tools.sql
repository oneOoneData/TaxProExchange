-- AI Tools Wall Migration
-- Creates tables for AI tools, reviews, and voting system
-- Date: 2025-01-29

-- Ensure extensions exist
create extension if not exists pgcrypto;
create extension if not exists "uuid-ossp";
create extension if not exists pg_trgm;

-- =============================================
-- TABLE: ai_tools
-- =============================================
create table if not exists ai_tools (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  category text,
  website_url text,
  logo_url text,
  short_description text,
  long_description text,
  affiliate_url text,
  collateral_links jsonb default '[]'::jsonb, -- e.g. [{title, url, type: 'article'|'webinar'|'demo'}]
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_ai_tools_slug on ai_tools (slug);
create index if not exists idx_ai_tools_category on ai_tools (category) where category is not null;
create index if not exists idx_ai_tools_name on ai_tools using gin (name gin_trgm_ops);

-- =============================================
-- TABLE: ai_reviews
-- =============================================
create table if not exists ai_reviews (
  id uuid primary key default gen_random_uuid(),
  tool_id uuid not null references ai_tools(id) on delete cascade,
  source text not null, -- 'reddit' or other sources
  author text,
  content text not null,
  permalink text,
  upvotes int default 0,
  created_at timestamptz not null default now()
);

create index if not exists idx_ai_reviews_tool_id on ai_reviews (tool_id);
create index if not exists idx_ai_reviews_source on ai_reviews (source);
create index if not exists idx_ai_reviews_created_at on ai_reviews (created_at desc);
-- Partial unique index: only enforce uniqueness when permalink is not null
create unique index if not exists idx_ai_reviews_tool_permalink_unique 
  on ai_reviews (tool_id, permalink) 
  where permalink is not null;

-- =============================================
-- TABLE: ai_votes
-- =============================================
create table if not exists ai_votes (
  id uuid primary key default gen_random_uuid(),
  tool_id uuid not null references ai_tools(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  vote int not null default 1 check (vote = 1), -- only upvotes for now
  created_at timestamptz not null default now(),
  unique(tool_id, user_id)
);

create index if not exists idx_ai_votes_tool_id on ai_votes (tool_id);
create index if not exists idx_ai_votes_user_id on ai_votes (user_id);
create index if not exists idx_ai_votes_tool_user on ai_votes (tool_id, user_id);

-- =============================================
-- FUNCTION: Get vote count for a tool
-- =============================================
create or replace function get_tool_vote_count(tool_uuid uuid)
returns int
language sql
stable
as $$
  select count(*)::int
  from ai_votes
  where tool_id = tool_uuid;
$$;

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================

-- Enable RLS
alter table ai_tools enable row level security;
alter table ai_reviews enable row level security;
alter table ai_votes enable row level security;

-- ai_tools: Everyone can read, only service role can write
create policy "ai_tools_select_public"
  on ai_tools for select
  using (true);

-- ai_reviews: Everyone can read
create policy "ai_reviews_select_public"
  on ai_reviews for select
  using (true);

-- ai_votes: Everyone can read vote counts
-- Note: Insert/delete will be handled server-side via API routes that check Clerk auth
create policy "ai_votes_select_public"
  on ai_votes for select
  using (true);

-- No insert/delete policies - handled via service role key in API routes

-- =============================================
-- NOTES
-- =============================================
-- 
-- Logo upload instructions:
-- 1. Logos should be uploaded to Supabase Storage bucket (or external CDN)
-- 2. Recommended size: 400x400px (square)
-- 3. Format: PNG or SVG preferred
-- 4. Store logo_url as full URL (e.g., https://supabase.co/storage/v1/object/public/logos/taxgpt.png)
-- 
-- To add tools manually:
-- INSERT INTO ai_tools (name, slug, category, website_url, logo_url, short_description, long_description)
-- VALUES ('TaxGPT', 'taxgpt', 'AI Assistant', 'https://taxgpt.com', 'https://...', 'Short desc', 'Long desc');
-- 
-- Reddit reviews will be populated via cron script: scripts/fetchRedditReviews.ts

