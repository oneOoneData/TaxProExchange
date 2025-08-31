-- TaxProExchange Database Schema
-- Run this in your Supabase SQL Editor

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS users (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    auth_provider TEXT NOT NULL DEFAULT 'email',
    role TEXT NOT NULL DEFAULT 'member',
    is_active BOOLEAN NOT NULL DEFAULT true,
    last_sign_in_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Profiles table
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    headline TEXT,
    bio TEXT,
    credential_type TEXT NOT NULL CHECK (credential_type IN ('CPA', 'EA', 'CTEC', 'Student', 'Tax Lawyer (JD)', 'PTIN Only', 'Other')),
    ptin TEXT,
    website_url TEXT,
    linkedin_url TEXT,
    firm_name TEXT,
    phone TEXT,
    public_email TEXT,
    avatar_url TEXT,
    is_listed BOOLEAN NOT NULL DEFAULT false,
    visibility_state TEXT NOT NULL DEFAULT 'hidden' CHECK (visibility_state IN ('hidden', 'pending_verification', 'verified', 'rejected')),
    accepting_work BOOLEAN NOT NULL DEFAULT true,
    slug TEXT UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Specializations master list
CREATE TABLE IF NOT EXISTS specializations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug TEXT UNIQUE NOT NULL,
    label TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Profile specializations (many-to-many)
CREATE TABLE IF NOT EXISTS profile_specializations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    specialization_id UUID REFERENCES specializations(id) ON DELETE CASCADE NOT NULL,
    UNIQUE(profile_id, specialization_id)
);

-- Locations
CREATE TABLE IF NOT EXISTS locations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    country TEXT NOT NULL DEFAULT 'US',
    state TEXT CHECK (state ~ '^[A-Z]{2}$'),
    city TEXT,
    UNIQUE(country, state, city)
);

-- Profile locations (many-to-many)
CREATE TABLE IF NOT EXISTS profile_locations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    location_id UUID REFERENCES locations(id) ON DELETE CASCADE NOT NULL,
    UNIQUE(profile_id, location_id)
);

-- Licenses table
CREATE TABLE IF NOT EXISTS licenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    license_kind TEXT NOT NULL CHECK (license_kind IN ('CPA_STATE_LICENSE', 'EA_ENROLLMENT', 'CTEC_REG', 'OTHER')),
    license_number TEXT NOT NULL,
    issuing_authority TEXT NOT NULL,
    state TEXT CHECK (state ~ '^[A-Z]{2}$'),
    expires_on DATE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'rejected')),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Waitlist table
CREATE TABLE IF NOT EXISTS waitlist (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    role_interest TEXT CHECK (role_interest IN ('CPA', 'EA', 'CTEC', 'Student')),
    notes TEXT,
    source TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for search performance
CREATE INDEX IF NOT EXISTS idx_profiles_visibility_state ON profiles(visibility_state);
CREATE INDEX IF NOT EXISTS idx_profiles_is_listed ON profiles(is_listed);
CREATE INDEX IF NOT EXISTS idx_profiles_credential_type ON profiles(credential_type);
CREATE INDEX IF NOT EXISTS idx_profiles_accepting_work ON profiles(accepting_work);
CREATE INDEX IF NOT EXISTS idx_profiles_slug ON profiles(slug);

-- Full-text search index
CREATE INDEX IF NOT EXISTS idx_profiles_fts ON profiles USING gin(
    to_tsvector('english', coalesce(headline, '') || ' ' || coalesce(bio, '') || ' ' || coalesce(firm_name, ''))
);

-- Trigram index for partial matching
CREATE INDEX IF NOT EXISTS idx_profiles_trgm ON profiles USING gin(
    (headline || ' ' || coalesce(bio, '') || ' ' || coalesce(firm_name, '')) gin_trgm_ops
);

-- Insert seed specializations
INSERT INTO specializations (slug, label) VALUES
('s_corp', 'S-Corporation'),
('multi_state', 'Multi-State'),
('real_estate', 'Real Estate'),
('crypto', 'Cryptocurrency'),
('irs_rep', 'IRS Representation'),
('1040', 'Individual Returns'),
('business', 'Business Returns'),
('partnership', 'Partnership Returns'),
('estate_tax', 'Estate & Gift Tax'),
('international', 'International Tax')
ON CONFLICT (slug) DO NOTHING;

-- Insert sample locations
INSERT INTO locations (country, state, city) VALUES
('US', 'CA', 'Los Angeles'),
('US', 'CA', 'San Francisco'),
('US', 'NY', 'New York'),
('US', 'TX', 'Houston'),
('US', 'TX', 'Dallas'),
('US', 'FL', 'Miami'),
('US', 'IL', 'Chicago'),
-- Add state-only locations for broader coverage
('US', 'CA', NULL),
('US', 'AZ', NULL),
('US', 'NV', NULL),
('US', 'TX', NULL),
('US', 'NY', NULL),
('US', 'FL', NULL)
ON CONFLICT (country, state, city) DO NOTHING;

-- Row Level Security (RLS) policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE waitlist ENABLE ROW LEVEL SECURITY;

-- Profiles: public read for verified profiles, users can edit their own
CREATE POLICY "profiles_read_public" ON profiles
    FOR SELECT USING (is_listed = true AND visibility_state = 'verified');

CREATE POLICY "profiles_self_rw" ON profiles
    FOR ALL TO authenticated USING (user_id = auth.uid());

-- Users: users can read their own profile
CREATE POLICY "users_self_read" ON users
    FOR SELECT USING (id = auth.uid());

-- Waitlist: anyone can insert
CREATE POLICY "waitlist_insert" ON waitlist
    FOR INSERT WITH CHECK (true);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_licenses_updated_at BEFORE UPDATE ON licenses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
