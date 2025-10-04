-- Check current database state and fix RLS policies
-- This script handles both cases: tables exist or need to be created

-- First, let's see what tables exist
DO $$
BEGIN
    -- Check if profile_specializations exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profile_specializations') THEN
        RAISE NOTICE 'profile_specializations table exists';
        
        -- Check if it has the new structure (specialization_slug) or old structure (specialization_id)
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profile_specializations' AND column_name = 'specialization_slug') THEN
            RAISE NOTICE 'profile_specializations has new structure (specialization_slug)';
        ELSE
            RAISE NOTICE 'profile_specializations has old structure (specialization_id) - needs migration';
        END IF;
    ELSE
        RAISE NOTICE 'profile_specializations table does not exist - needs creation';
    END IF;
    
    -- Check profile_locations
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profile_locations') THEN
        RAISE NOTICE 'profile_locations table exists';
    ELSE
        RAISE NOTICE 'profile_locations table does not exist - needs creation';
    END IF;
    
    -- Check profile_software
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profile_software') THEN
        RAISE NOTICE 'profile_software table exists';
    ELSE
        RAISE NOTICE 'profile_software table does not exist - needs creation';
    END IF;
END $$;
