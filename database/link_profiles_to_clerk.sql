-- Link profiles to Clerk user IDs
-- Run this in your Supabase SQL Editor

-- Add Clerk user ID column to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS clerk_user_id TEXT;

-- Create index for Clerk user lookups
CREATE INDEX IF NOT EXISTS idx_profiles_clerk_user_id ON profiles(clerk_user_id);

-- Update your main profile with your Clerk user ID
-- Replace 'your-clerk-user-id' with your actual Clerk user ID
UPDATE profiles 
SET clerk_user_id = 'your-clerk-user-id'
WHERE first_name = 'Koen' 
  AND last_name = 'Van Duyse'
  AND credential_type = 'EA'  -- Keep your main EA profile
  AND headline = 'ddd';

-- Mark other duplicate profiles as deleted (soft delete)
UPDATE profiles 
SET 
    is_deleted = true,
    deleted_at = NOW(),
    visibility_state = 'hidden',
    is_listed = false
WHERE first_name = 'Koen' 
  AND last_name = 'Van Duyse'
  AND id NOT IN (
    SELECT id FROM profiles 
    WHERE first_name = 'Koen' 
      AND last_name = 'Van Duyse'
      AND credential_type = 'EA'
      AND headline = 'ddd'
    LIMIT 1
  );

-- Create RLS policy for users to access their own profile
CREATE POLICY "users_access_own_profile" ON profiles
    FOR ALL TO authenticated
    USING (
        clerk_user_id = auth.jwt() ->> 'sub'  -- Clerk user ID from JWT
        OR id = auth.uid()  -- Fallback to profile ID
    );

-- Function to get current user's profile
CREATE OR REPLACE FUNCTION get_my_profile()
RETURNS TABLE (
    id UUID,
    first_name TEXT,
    last_name TEXT,
    credential_type TEXT,
    headline TEXT,
    bio TEXT,
    firm_name TEXT,
    slug TEXT,
    visibility_state TEXT,
    is_listed BOOLEAN,
    is_deleted BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.first_name,
        p.last_name,
        p.credential_type,
        p.headline,
        p.bio,
        p.firm_name,
        p.slug,
        p.visibility_state,
        p.is_listed,
        p.is_deleted
    FROM profiles p
    WHERE p.clerk_user_id = auth.jwt() ->> 'sub'
      AND p.is_deleted = false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_my_profile() TO authenticated;
