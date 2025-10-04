-- Fix RLS policies for profile-related tables to allow public read access
-- This allows anyone to read specializations, locations, and software for any profile (needed for public profile pages)

-- Fix profile_specializations
DROP POLICY IF EXISTS "profile_specializations_self_rw" ON profile_specializations;
CREATE POLICY "profile_specializations_public_read" ON profile_specializations
    FOR SELECT USING (true);
CREATE POLICY "profile_specializations_self_write" ON profile_specializations
    FOR ALL USING (
        profile_id IN (
            SELECT id FROM profiles 
            WHERE clerk_id = current_setting('app.clerk_user_id', true)::text
        )
    );

-- Fix profile_locations
DROP POLICY IF EXISTS "profile_locations_self_rw" ON profile_locations;
CREATE POLICY "profile_locations_public_read" ON profile_locations
    FOR SELECT USING (true);
CREATE POLICY "profile_locations_self_write" ON profile_locations
    FOR ALL USING (
        profile_id IN (
            SELECT id FROM profiles 
            WHERE clerk_id = current_setting('app.clerk_user_id', true)::text
        )
    );

-- Fix profile_software
DROP POLICY IF EXISTS "profile_software_self_rw" ON profile_software;
CREATE POLICY "profile_software_public_read" ON profile_software
    FOR SELECT USING (true);
CREATE POLICY "profile_software_self_write" ON profile_software
    FOR ALL USING (
        profile_id IN (
            SELECT id FROM profiles 
            WHERE clerk_id = current_setting('app.clerk_user_id', true)::text
        )
    );

-- Print completion message
DO $$
BEGIN
    RAISE NOTICE 'Profile-related RLS policies updated successfully!';
    RAISE NOTICE 'Public read access enabled for profile specializations, locations, and software.';
END $$;
