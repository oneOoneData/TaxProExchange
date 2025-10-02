-- Clear existing events to start fresh with link health validation
-- Run this before applying the link health migration and repulling events

-- Clear all existing events
DELETE FROM events;

-- Clear staging events if any exist
DELETE FROM staging_events;

-- Clear event URL tombstones if any exist  
DELETE FROM event_url_tombstones;

-- Reset any sequences if needed
-- (PostgreSQL will handle this automatically for UUID columns)

-- Verify tables are empty
SELECT 'events' as table_name, count(*) as row_count FROM events
UNION ALL
SELECT 'staging_events' as table_name, count(*) as row_count FROM staging_events  
UNION ALL
SELECT 'event_url_tombstones' as table_name, count(*) as row_count FROM event_url_tombstones;
