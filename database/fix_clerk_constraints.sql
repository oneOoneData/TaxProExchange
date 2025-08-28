-- Fix Clerk constraints based on current database state
-- Run this in your Supabase SQL Editor

-- 1. First, check current state
SELECT 
    'Current clerk_id state' as info,
    COUNT(*) as total_profiles,
    COUNT(clerk_id) as profiles_with_clerk_id,
    COUNT(*) - COUNT(clerk_id) as profiles_without_clerk_id
FROM profiles;

-- 2. Check for any duplicate clerk_ids
SELECT 
    'Duplicate check' as info,
    clerk_id,
    COUNT(*) as count
FROM profiles 
WHERE clerk_id IS NOT NULL
GROUP BY clerk_id 
HAVING COUNT(*) > 1;

-- 3. If there are duplicates, keep only the most recent one for each clerk_id
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

-- 4. Add unique constraint on clerk_id (this will fail if there are still duplicates)
ALTER TABLE profiles ADD CONSTRAINT profiles_clerk_id_unique UNIQUE (clerk_id);

-- 5. Make clerk_id NOT NULL for new profiles (optional - only if you want to enforce this)
-- ALTER TABLE profiles ALTER COLUMN clerk_id SET NOT NULL;

-- 6. Create unique index for performance
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_clerk_id_unique ON profiles(clerk_id);

-- 7. Verify the fix worked
SELECT 
    'Final state' as info,
    COUNT(*) as total_profiles,
    COUNT(clerk_id) as profiles_with_clerk_id,
    COUNT(*) - COUNT(clerk_id) as profiles_without_clerk_id
FROM profiles;

-- 8. Show all profiles with their clerk_ids
SELECT 
    id,
    clerk_id,
    first_name,
    last_name,
    created_at
FROM profiles 
ORDER BY created_at DESC;
