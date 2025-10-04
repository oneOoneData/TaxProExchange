-- Find all tables that might contain professional profile data
SELECT table_name, table_type 
FROM information_schema.tables 
WHERE table_name LIKE '%profile%' 
   OR table_name LIKE '%professional%'
   OR table_name LIKE '%cpa%'
   OR table_name LIKE '%tax%'
   OR table_name LIKE '%specialization%'
ORDER BY table_name;

-- Also check for any tables that might have the data we're looking for
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;
