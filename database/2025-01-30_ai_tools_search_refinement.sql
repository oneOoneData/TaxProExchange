-- Add search refinement columns to ai_tools table
-- Date: 2025-01-30

-- Add search_phrase column for custom Reddit search queries
-- Example: "Thomson Reuters CoCounsel" instead of just "CoCounsel"
alter table ai_tools 
  add column if not exists search_phrase text;

-- Add exclude_phrase column to filter out unwanted results
-- Example: exclude "Solomon page" when searching for "Solomon"
alter table ai_tools 
  add column if not exists exclude_phrase text;

-- Add index for search_phrase lookups (optional but helpful)
create index if not exists idx_ai_tools_search_phrase 
  on ai_tools (search_phrase) 
  where search_phrase is not null;

comment on column ai_tools.search_phrase is 'Custom search phrase for Reddit API queries. If null, uses tool name.';
comment on column ai_tools.exclude_phrase is 'Phrase to exclude from Reddit results. Content containing this phrase will be filtered out.';

