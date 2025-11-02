-- AI Tools Sentiment Summary Migration
-- Adds sentiment analysis table for AI-generated summaries of Reddit discussions
-- Date: 2025-01-29

-- =============================================
-- TABLE: ai_sentiments
-- =============================================
create table if not exists ai_sentiments (
  id uuid primary key default gen_random_uuid(),
  tool_id uuid not null references ai_tools(id) on delete cascade,
  sentiment_label text check (sentiment_label in ('positive', 'mixed', 'negative')),
  summary text not null,
  updated_at timestamptz not null default now(),
  unique(tool_id)
);

create index if not exists idx_ai_sentiments_tool_id on ai_sentiments (tool_id);
create index if not exists idx_ai_sentiments_updated_at on ai_sentiments (updated_at desc);

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================

alter table ai_sentiments enable row level security;

-- Everyone can read sentiments
create policy "ai_sentiments_select_public"
  on ai_sentiments for select
  using (true);

-- No insert/update policies - handled via service role key in cron script

-- =============================================
-- NOTES
-- =============================================
-- 
-- This table stores AI-generated sentiment summaries from Reddit discussions.
-- Updated daily via cron job that:
-- 1. Fetches recent Reddit mentions
-- 2. Sends to OpenAI for sentiment analysis
-- 3. Stores summary here
-- 
-- Sentiment labels:
-- - 'positive': Overall favorable discussion
-- - 'mixed': Balanced feedback (pros and cons)
-- - 'negative': Critical or unfavorable discussion

