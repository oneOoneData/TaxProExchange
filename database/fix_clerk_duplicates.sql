-- Fix Clerk duplicate profiles and ensure proper constraints
-- Run this in your Supabase SQL Editor

-- 1. First, let's see if there are any duplicate clerk_ids
SELECT 
    clerk_id,
    COUNT(*) as count,
    array_agg(id) as profile_ids
FROM profiles 
WHERE clerk_id IS NOT NULL
GROUP BY clerk_id 
HAVING COUNT(*) > 1;

-- 2. If there are duplicates, keep only the most recent one for each clerk_id
-- (This will delete older duplicate profiles)
DELETE FROM profiles 
WHERE id IN (
    SELECT id FROM (
        SELECT id,
               ROW_NUMBER() OVER (PARTITION BY clerk_id ORDER BY created_at DESC) as rn
        FROM profiles 
        WHERE clerk_id IS NOT NULL
    ) ranked
    WHERE rn > 1
);

-- 3. Ensure the clerk_id column has proper constraints
-- Drop any existing unique constraints that might be causing issues
DO $$
BEGIN
    -- Drop existing unique constraints on clerk_id if they exist
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'profiles' 
        AND constraint_name LIKE '%clerk_id%' 
        AND constraint_type = 'UNIQUE'
    ) THEN
        EXECUTE (
            'ALTER TABLE profiles DROP CONSTRAINT ' || 
            (SELECT constraint_name FROM information_schema.table_constraints 
             WHERE table_name = 'profiles' 
             AND constraint_name LIKE '%clerk_id%' 
             AND constraint_type = 'UNIQUE' LIMIT 1)
        );
    END IF;
END $$;

-- 4. Add a clean unique constraint on clerk_id
ALTER TABLE profiles ADD CONSTRAINT profiles_clerk_id_unique UNIQUE (clerk_id);

-- 5. Create a unique index for performance
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_clerk_id_unique ON profiles(clerk_id);

-- 6. Verify the fix worked
SELECT 
    'Duplicate check' as check_name,
    CASE 
        WHEN COUNT(*) = 0 THEN '✅ NO DUPLICATES'
        ELSE '❌ STILL HAS DUPLICATES: ' || COUNT(*)
    END as status
FROM (
    SELECT clerk_id, COUNT(*) as count
    FROM profiles 
    WHERE clerk_id IS NOT NULL
    GROUP BY clerk_id 
    HAVING COUNT(*) > 1
) duplicates;

-- 7. Show final profile count
SELECT 
    'Total profiles' as info,
    COUNT(*) as count
FROM profiles;

-- 8. Show profiles with clerk_id
SELECT 
    'Profiles with clerk_id' as info,
    COUNT(*) as count
FROM profiles 
WHERE clerk_id IS NOT NULL;
