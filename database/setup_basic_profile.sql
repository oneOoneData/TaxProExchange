-- Basic profile table setup for TaxProExchange
-- Run this in your Supabase SQL Editor to get the basic profile functionality working

-- 1. Create profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clerk_id TEXT UNIQUE NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    headline TEXT,
    bio TEXT,
    credential_type TEXT NOT NULL CHECK (credential_type IN ('CPA', 'EA', 'CTEC', 'Student', 'Tax Lawyer (JD)', 'PTIN Only', 'Other')),
    firm_name TEXT,
    public_email TEXT,
    phone TEXT,
    website_url TEXT,
    linkedin_url TEXT,
    accepting_work BOOLEAN NOT NULL DEFAULT true,
    other_software TEXT[] DEFAULT '{}',
    onboarding_complete BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Add clerk_id column if it doesn't exist (for existing tables)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'clerk_id') THEN
        ALTER TABLE profiles ADD COLUMN clerk_id TEXT UNIQUE;
    END IF;
END $$;

-- 3. Add onboarding_complete column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'onboarding_complete') THEN
        ALTER TABLE profiles ADD COLUMN onboarding_complete BOOLEAN DEFAULT false;
    END IF;
END $$;

-- 4. Add other_software column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'other_software') THEN
        ALTER TABLE profiles ADD COLUMN other_software TEXT[] DEFAULT '{}';
    END IF;
END $$;

-- 5. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_clerk_id ON profiles(clerk_id);
CREATE INDEX IF NOT EXISTS idx_profiles_onboarding_complete ON profiles(onboarding_complete);

-- 6. Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 7. Create basic RLS policy (allow all operations for now - you can tighten this later)
DROP POLICY IF EXISTS "profiles_allow_all" ON profiles;
CREATE POLICY "profiles_allow_all" ON profiles FOR ALL USING (true);

-- 8. Grant permissions
GRANT ALL ON profiles TO authenticated;
GRANT ALL ON profiles TO anon;

-- Print completion message
DO $$
BEGIN
    RAISE NOTICE 'Basic profile table setup completed successfully!';
    RAISE NOTICE 'You can now save basic profile information.';
    RAISE NOTICE 'Run the full setup later to add specializations, states, and software tables.';
END $$;
