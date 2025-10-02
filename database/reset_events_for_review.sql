-- Reset Events for Human Review Process
-- This script clears all existing events and prepares for fresh ingestion

-- Step 1: Clear all existing events
DELETE FROM events;
DELETE FROM staging_events;
DELETE FROM event_url_tombstones;

-- Step 2: Reset any sequences if they exist
-- (PostgreSQL will auto-increment from 1 when tables are empty)

-- Step 3: Verify tables are empty
SELECT 'Events cleared' as status, COUNT(*) as count FROM events
UNION ALL
SELECT 'Staging events cleared', COUNT(*) FROM staging_events
UNION ALL
SELECT 'Tombstones cleared', COUNT(*) FROM event_url_tombstones;

-- Step 4: Show current review status columns (if they exist)
-- This will help verify the database schema is ready
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'events' 
    AND column_name IN ('review_status', 'reviewed_at', 'reviewed_by', 'admin_notes')
ORDER BY ordinal_position;
