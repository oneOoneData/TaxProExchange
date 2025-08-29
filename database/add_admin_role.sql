-- Add admin role functionality to profiles table (works with Clerk auth)
-- Run this in your Supabase SQL Editor
-- This script is safe to run multiple times

-- Add admin column to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_admin BOOLEAN NOT NULL DEFAULT false;

-- Add soft delete columns
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES profiles(id);

-- Create indexes for admin queries
CREATE INDEX IF NOT EXISTS idx_profiles_is_admin ON profiles(is_admin);
CREATE INDEX IF NOT EXISTS idx_profiles_is_deleted ON profiles(is_deleted);
CREATE INDEX IF NOT EXISTS idx_profiles_deleted_at ON profiles(deleted_at);

-- Grant admin role to specific profiles (replace with your profile ID or email)
-- You can find your profile ID by looking at the profiles table
UPDATE profiles 
SET is_admin = true 
WHERE email IN (
  'your-email@example.com'  -- Replace with your actual email
);

-- Alternative: Grant admin by profile ID if you know it
-- UPDATE profiles SET is_admin = true WHERE id = 'your-profile-uuid';

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "admin_access_all_profiles" ON profiles;
DROP POLICY IF EXISTS "admin_access_all_licenses" ON licenses;
DROP POLICY IF EXISTS "users_read_own_profile" ON profiles;
DROP POLICY IF EXISTS "users_update_own_profile" ON profiles;
DROP POLICY IF EXISTS "admins_read_all_profiles" ON profiles;
DROP POLICY IF EXISTS "admins_update_all_profiles" ON profiles;
DROP POLICY IF EXISTS "admins_delete_all_profiles" ON profiles;
DROP POLICY IF EXISTS "public_read_verified_profiles" ON profiles;

-- Create RLS policy for admin access to profiles
-- This allows admins to access all profiles
CREATE POLICY "admin_access_all_profiles" ON profiles
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid() 
            AND p.is_admin = true
        )
    );

-- Create RLS policy for admin access to licenses table
CREATE POLICY "admin_access_all_licenses" ON licenses
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid() 
            AND p.is_admin = true
        )
    );

-- Function to check if current user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() 
        AND is_admin = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to soft delete a profile
CREATE OR REPLACE FUNCTION soft_delete_profile(profile_id UUID, admin_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE profiles 
    SET 
        is_deleted = true,
        deleted_at = NOW(),
        deleted_by = admin_id,
        visibility_state = 'hidden',
        is_listed = false
    WHERE id = profile_id;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to restore a soft-deleted profile
CREATE OR REPLACE FUNCTION restore_profile(profile_id UUID, admin_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE profiles 
    SET 
        is_deleted = false,
        deleted_at = NULL,
        deleted_by = NULL,
        visibility_state = 'hidden',
        is_listed = false
    WHERE id = profile_id;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION soft_delete_profile(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION restore_profile(UUID, UUID) TO authenticated;

-- Enable RLS on profiles table if not already enabled
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create basic RLS policies for profiles
-- Users can read their own profile (if not deleted)
CREATE POLICY "users_read_own_profile" ON profiles
    FOR SELECT TO authenticated
    USING (id = auth.uid() AND is_deleted = false);

-- Users can update their own profile (if not deleted)
CREATE POLICY "users_update_own_profile" ON profiles
    FOR UPDATE TO authenticated
    USING (id = auth.uid() AND is_deleted = false);

-- Admins can read all profiles (including deleted ones)
CREATE POLICY "admins_read_all_profiles" ON profiles
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid() 
            AND p.is_admin = true
        )
    );

-- Admins can update all profiles
CREATE POLICY "admins_update_all_profiles" ON profiles
    FOR UPDATE TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid() 
            AND p.is_admin = true
        )
    );

-- Admins can delete all profiles
CREATE POLICY "admins_delete_all_profiles" ON profiles
    FOR DELETE TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid() 
            AND p.is_admin = true
        )
    );

-- Public can only see non-deleted, verified, and listed profiles
CREATE POLICY "public_read_verified_profiles" ON profiles
    FOR SELECT TO anon
    USING (
        is_deleted = false 
        AND visibility_state = 'verified' 
        AND is_listed = true
    );
