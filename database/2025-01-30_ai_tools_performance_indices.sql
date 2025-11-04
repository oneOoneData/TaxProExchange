-- AI Tools Performance Indices
-- Adds composite indices to optimize queries for tool detail pages
-- Date: 2025-01-30

-- Composite index for reviews ordered by upvotes and created_at
-- This optimizes queries that fetch reviews for a specific tool sorted by popularity
create index if not exists idx_ai_reviews_tool_upvotes_created 
  on ai_reviews (tool_id, upvotes desc, created_at desc);

-- Note: The following indices already exist from previous migrations:
-- - idx_ai_tools_slug on ai_tools(slug) - for slug lookups
-- - idx_ai_tools_name on ai_tools using gin (name gin_trgm_ops) - for name ILIKE queries
-- - idx_ai_reviews_tool_id on ai_reviews(tool_id) - for tool_id filters
-- - idx_ai_votes_tool_id on ai_votes(tool_id) - for vote counts
-- - idx_ai_sentiments_tool_id on ai_sentiments(tool_id) - for sentiment lookups

