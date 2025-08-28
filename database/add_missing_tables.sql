-- Add missing tables for profile update functionality
-- Run this in your Supabase SQL Editor

-- 1. Update profile_specializations table to use slugs instead of UUIDs
-- First, drop the existing table if it exists
DROP TABLE IF EXISTS profile_specializations CASCADE;

-- Create new profile_specializations table with slug-based approach
CREATE TABLE IF NOT EXISTS profile_specializations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    specialization_slug TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(profile_id, specialization_slug)
);

-- 2. Update profile_locations table to use state directly instead of location_id
-- First, drop the existing table if it exists
DROP TABLE IF EXISTS profile_locations CASCADE;

-- Create new profile_locations table with direct state storage
CREATE TABLE IF NOT EXISTS profile_locations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    state TEXT NOT NULL CHECK (state ~ '^[A-Z]{2}$'),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(profile_id, state)
);

-- 3. Create profile_software table for software proficiency
CREATE TABLE IF NOT EXISTS profile_software (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    software_slug TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(profile_id, software_slug)
);

-- 4. Add other_software column to profiles table if it doesn't exist
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS other_software TEXT[] DEFAULT '{}';

-- 5. Add headline and bio columns if they don't exist
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS headline TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bio TEXT;

-- 6. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_profile_specializations_profile_id ON profile_specializations(profile_id);
CREATE INDEX IF NOT EXISTS idx_profile_specializations_slug ON profile_specializations(specialization_slug);
CREATE INDEX IF NOT EXISTS idx_profile_locations_profile_id ON profile_locations(profile_id);
CREATE INDEX IF NOT EXISTS idx_profile_locations_state ON profile_locations(state);
CREATE INDEX IF NOT EXISTS idx_profile_software_profile_id ON profile_software(profile_id);
CREATE INDEX IF NOT EXISTS idx_profile_software_slug ON profile_software(software_slug);

-- 7. Grant permissions
GRANT ALL ON profile_specializations TO authenticated;
GRANT ALL ON profile_locations TO authenticated;
GRANT ALL ON profile_software TO authenticated;

-- 8. Create RLS policies for the new tables
-- Profile specializations
CREATE POLICY "profile_specializations_self_rw" ON profile_specializations
    FOR ALL USING (
        profile_id IN (
            SELECT id FROM profiles 
            WHERE clerk_id = current_setting('app.clerk_user_id', true)::text
        )
    );

-- Profile locations
CREATE POLICY "profile_locations_self_rw" ON profile_locations
    FOR ALL USING (
        profile_id IN (
            SELECT id FROM profiles 
            WHERE clerk_id = current_setting('app.clerk_user_id', true)::text
        )
    );

-- Profile software
CREATE POLICY "profile_software_self_rw" ON profile_software
    FOR ALL USING (
        profile_id IN (
            SELECT id FROM profiles 
            WHERE clerk_id = current_setting('app.clerk_user_id', true)::text
        )
    );

-- 9. Enable RLS on the new tables
ALTER TABLE profile_specializations ENABLE ROW LEVEL SECURITY;
ALTER TABLE profile_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE profile_software ENABLE ROW LEVEL SECURITY;

-- Print completion message
DO $$
BEGIN
    RAISE NOTICE 'Missing tables added successfully!';
    RAISE NOTICE 'Your database now supports full profile updates with specializations, states, and software.';
END $$;
