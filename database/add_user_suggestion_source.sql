-- Add 'user_suggestion' to the event_source enum
-- This allows us to distinguish between different types of curated content

-- Add the new enum value
ALTER TYPE event_source ADD VALUE IF NOT EXISTS 'user_suggestion';

-- Add comment to document the new value
COMMENT ON TYPE event_source IS 'Source of the event: curated (admin-curated), ai_generated (AI-extracted), user_suggestion (user-suggested)';
