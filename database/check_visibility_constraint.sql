-- Check what values are allowed for visibility_state column
SELECT 
    'visibility_state constraint' as check_name,
    pg_get_constraintdef(con.oid) as constraint_definition
FROM pg_constraint con
JOIN pg_class cls ON con.conrelid = cls.oid
JOIN pg_namespace nsp ON cls.relnamespace = nsp.oid
WHERE cls.relname = 'profiles' 
AND con.conname LIKE '%visibility_state%';

-- Also check the column definition
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND column_name = 'visibility_state';
