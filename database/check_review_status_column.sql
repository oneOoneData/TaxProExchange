-- Check if review_status column exists in events table
-- Run this first to see if the migration has been applied

SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'events' 
    AND column_name = 'review_status';

-- If the above returns no rows, the migration hasn't been applied
-- If it returns a row, the column exists and the migration is applied

-- Also check for the enum type
SELECT 
    typname as enum_name,
    array_agg(enumlabel ORDER BY enumsortorder) as enum_values
FROM pg_type 
JOIN pg_enum ON pg_type.oid = pg_enum.enumtypid 
WHERE typname = 'event_review_status'
GROUP BY typname;
