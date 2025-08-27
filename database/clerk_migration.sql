-- Clerk Migration Script for TaxProExchange
-- Run this in your Supabase SQL Editor AFTER setting up Clerk

-- 1. Add clerk_id column to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS clerk_id TEXT UNIQUE;

-- 2. Create index on clerk_id for performance
CREATE INDEX IF NOT EXISTS idx_profiles_clerk_id ON profiles(clerk_id);

-- 3. Update profiles table to make user_id optional (since we'll use clerk_id)
ALTER TABLE profiles ALTER COLUMN user_id DROP NOT NULL;

-- 4. Add a check constraint to ensure either user_id OR clerk_id is present
ALTER TABLE profiles ADD CONSTRAINT profiles_user_or_clerk_id 
    CHECK (user_id IS NOT NULL OR clerk_id IS NOT NULL);

-- 5. Update RLS policies to work with Clerk
-- First, drop the old policies
DROP POLICY IF EXISTS "profiles_self_rw" ON profiles;
DROP POLICY IF EXISTS "users_self_read" ON users;

-- 6. Create new RLS policies for Clerk
-- Profiles: public read for verified profiles (drop if exists first)
DROP POLICY IF EXISTS "profiles_read_public" ON profiles;
CREATE POLICY "profiles_read_public" ON profiles
    FOR SELECT USING (is_listed = true AND visibility_state = 'verified');

-- Profiles: users can edit their own (using clerk_id)
CREATE POLICY "profiles_self_rw" ON profiles
    FOR ALL USING (
        clerk_id IS NOT NULL 
        AND clerk_id = current_setting('app.clerk_user_id', true)::text
    );

-- 7. Update the profiles table to use clerk_id as the primary identifier
-- This will be populated by the Clerk webhook when users sign up

-- 8. Create a function to get the current Clerk user ID from the request
CREATE OR REPLACE FUNCTION get_clerk_user_id()
RETURNS TEXT AS $$
BEGIN
    -- This will be set by the Clerk webhook or middleware
    RETURN current_setting('app.clerk_user_id', true);
END;
$$ LANGUAGE plpgsql;

-- 9. Update the profiles table to use clerk_id for self-referencing
-- This allows users to manage their own profiles

-- 10. Optional: Add a trigger to automatically set clerk_id when user_id is provided
-- This helps with backward compatibility during migration

-- 11. Update verification_requests table if it exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'verification_requests') THEN
        -- Add clerk_id column if the table exists
        ALTER TABLE verification_requests ADD COLUMN IF NOT EXISTS clerk_id TEXT;
        CREATE INDEX IF NOT EXISTS idx_verification_requests_clerk_id ON verification_requests(clerk_id);
    END IF;
END $$;

-- 12. Clean up old auth.users references (optional - only if you're sure you don't need them)
-- ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_user_id_fkey;
-- ALTER TABLE profiles DROP COLUMN IF EXISTS user_id;

-- 13. Create a view for easier profile management
CREATE OR REPLACE VIEW user_profiles AS
SELECT 
    p.*,
    COALESCE(p.clerk_id, p.user_id::text) as auth_id
FROM profiles p
WHERE p.clerk_id IS NOT NULL OR p.user_id IS NOT NULL;

-- 14. Grant necessary permissions
GRANT SELECT ON user_profiles TO authenticated;
GRANT SELECT ON profiles TO authenticated;

-- 15. Update the profiles table structure for better Clerk integration
-- Add any missing columns that Clerk might need
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email TEXT;

-- 16. Create a function to upsert profiles from Clerk webhook
CREATE OR REPLACE FUNCTION upsert_profile_from_clerk(
    p_clerk_id TEXT,
    p_email TEXT,
    p_first_name TEXT,
    p_last_name TEXT,
    p_image_url TEXT
)
RETURNS UUID AS $$
DECLARE
    profile_id UUID;
BEGIN
    INSERT INTO profiles (
        clerk_id,
        email,
        first_name,
        last_name,
        image_url,
        headline,
        credential_type,
        visibility_state,
        is_listed,
        slug
    ) VALUES (
        p_clerk_id,
        p_email,
        p_first_name,
        p_last_name,
        p_image_url,
        COALESCE(p_first_name || ' ' || p_last_name, 'New Professional'),
        'Other',
        'pending',
        false,
        p_clerk_id || '-' || extract(epoch from now())::bigint
    )
    ON CONFLICT (clerk_id) 
    DO UPDATE SET
        email = EXCLUDED.email,
        first_name = EXCLUDED.first_name,
        last_name = EXCLUDED.last_name,
        image_url = EXCLUDED.image_url,
        updated_at = NOW()
    RETURNING id INTO profile_id;
    
    RETURN profile_id;
END;
$$ LANGUAGE plpgsql;

-- 17. Grant execute permission on the function
GRANT EXECUTE ON FUNCTION upsert_profile_from_clerk(TEXT, TEXT, TEXT, TEXT, TEXT) TO authenticated;

-- 18. Create a simple function to get profile by Clerk ID
CREATE OR REPLACE FUNCTION get_profile_by_clerk_id(p_clerk_id TEXT)
RETURNS TABLE (
    id UUID,
    first_name TEXT,
    last_name TEXT,
    headline TEXT,
    bio TEXT,
    credential_type TEXT,
    firm_name TEXT,
    public_email TEXT,
    phone TEXT,
    website_url TEXT,
    linkedin_url TEXT,
    accepting_work BOOLEAN,
    visibility_state TEXT,
    is_listed BOOLEAN,
    slug TEXT,
    created_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.first_name,
        p.last_name,
        p.headline,
        p.bio,
        p.credential_type,
        p.firm_name,
        p.public_email,
        p.phone,
        p.website_url,
        p.linkedin_url,
        p.accepting_work,
        p.visibility_state,
        p.is_listed,
        p.slug,
        p.created_at
    FROM profiles p
    WHERE p.clerk_id = p_clerk_id;
END;
$$ LANGUAGE plpgsql;

-- 19. Grant execute permission
GRANT EXECUTE ON FUNCTION get_profile_by_clerk_id(TEXT) TO authenticated;

-- 20. Final cleanup - remove any unused columns or constraints
-- This is optional and can be done after testing

-- Print completion message
DO $$
BEGIN
    RAISE NOTICE 'Clerk migration completed successfully!';
    RAISE NOTICE 'Your database is now ready to work with Clerk authentication.';
    RAISE NOTICE 'Make sure to test the Clerk webhook endpoint at /api/webhooks/clerk';
END $$;
