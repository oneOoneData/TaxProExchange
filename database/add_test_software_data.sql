-- Add test software data to profile_software table for testing the software filter
-- Run this in your Supabase SQL Editor

-- Get profile IDs for testing
-- Haniyya Siddiqi
INSERT INTO profile_software (profile_id, software_slug)
SELECT id, 'drake' FROM profiles WHERE first_name = 'Haniyya' AND last_name = 'Siddiqi'
ON CONFLICT (profile_id, software_slug) DO NOTHING;

INSERT INTO profile_software (profile_id, software_slug)
SELECT id, 'proseries' FROM profiles WHERE first_name = 'Haniyya' AND last_name = 'Siddiqi'
ON CONFLICT (profile_id, software_slug) DO NOTHING;

INSERT INTO profile_software (profile_id, software_slug)
SELECT id, 'turbotax' FROM profiles WHERE first_name = 'Haniyya' AND last_name = 'Siddiqi'
ON CONFLICT (profile_id, software_slug) DO NOTHING;

-- Test User
INSERT INTO profile_software (profile_id, software_slug)
SELECT id, 'taxdome' FROM profiles WHERE first_name = 'Test' AND last_name = 'User'
ON CONFLICT (profile_id, software_slug) DO NOTHING;

INSERT INTO profile_software (profile_id, software_slug)
SELECT id, 'quickbooks' FROM profiles WHERE first_name = 'Test' AND last_name = 'User'
ON CONFLICT (profile_id, software_slug) DO NOTHING;

-- Andrew Edmundson
INSERT INTO profile_software (profile_id, software_slug)
SELECT id, 'lacerte' FROM profiles WHERE first_name = 'Andrew' AND last_name = 'Edmundson'
ON CONFLICT (profile_id, software_slug) DO NOTHING;

INSERT INTO profile_software (profile_id, software_slug)
SELECT id, 'ultratax' FROM profiles WHERE first_name = 'Andrew' AND last_name = 'Edmundson'
ON CONFLICT (profile_id, software_slug) DO NOTHING;

-- Kari Petersen
INSERT INTO profile_software (profile_id, software_slug)
SELECT id, 'truss' FROM profiles WHERE first_name = 'Kari' AND last_name = 'Petersen'
ON CONFLICT (profile_id, software_slug) DO NOTHING;

INSERT INTO profile_software (profile_id, software_slug)
SELECT id, 'canopy' FROM profiles WHERE first_name = 'Kari' AND last_name = 'Petersen'
ON CONFLICT (profile_id, software_slug) DO NOTHING;

-- Ross Merry
INSERT INTO profile_software (profile_id, software_slug)
SELECT id, 'xero' FROM profiles WHERE first_name = 'Ross' AND last_name = 'Merry'
ON CONFLICT (profile_id, software_slug) DO NOTHING;

INSERT INTO profile_software (profile_id, software_slug)
SELECT id, 'freshbooks' FROM profiles WHERE first_name = 'Ross' AND last_name = 'Merry'
ON CONFLICT (profile_id, software_slug) DO NOTHING;

-- Verify the updates
SELECT 
    ps.profile_id,
    p.first_name,
    p.last_name,
    ps.software_slug
FROM profile_software ps
JOIN profiles p ON ps.profile_id = p.id
ORDER BY p.first_name, ps.software_slug;
