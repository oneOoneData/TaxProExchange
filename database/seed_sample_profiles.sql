-- Seed sample profiles for testing Stage 2 functionality
-- This creates verified profiles that will show up in search results

-- Insert sample users (these would normally come from auth)
INSERT INTO users (id, email, auth_provider, role) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'jordan@chanandco.com', 'google', 'member'),
('550e8400-e29b-41d4-a716-446655440002', 'maya@rodrigueztax.com', 'google', 'member'),
('550e8400-e29b-41d4-a716-446655440003', 'leo@petersontax.com', 'google', 'member'),
('550e8400-e29b-41d4-a716-446655440004', 'sarah@smithcpa.com', 'google', 'member'),
('550e8400-e29b-41d4-a716-446655440005', 'david@jonesea.com', 'google', 'member')
ON CONFLICT (id) DO NOTHING;

-- Insert sample profiles
INSERT INTO profiles (id, user_id, first_name, last_name, headline, bio, credential_type, firm_name, public_email, phone, website_url, linkedin_url, accepting_work, visibility_state, is_listed, slug) VALUES
('550e8400-e29b-41d4-a716-446655440011', '550e8400-e29b-41d4-a716-446655440001', 'Jordan', 'Chan', 'CPA • S-Corp & Multi-State', '10+ years reviewing S-corps and multi-state filings; open for seasonal overflow. Specializing in complex business structures and multi-state compliance.', 'CPA', 'Chan & Co.', 'jordan@chanandco.com', '(555) 123-4567', 'https://chanandco.com', 'https://linkedin.com/in/jordanchan', true, 'verified', true, 'jordan-chan-cpa'),
('550e8400-e29b-41d4-a716-446655440012', '550e8400-e29b-41d4-a716-446655440002', 'Maya', 'Rodriguez', 'EA • IRS Representation', 'Specializing in tax resolution and IRS representation for individuals and small businesses. Expert in tax controversy and compliance.', 'EA', 'Rodriguez Tax Solutions', 'maya@rodrigueztax.com', '(555) 234-5678', 'https://rodrigueztax.com', 'https://linkedin.com/in/mayarodriguez', true, 'verified', true, 'maya-rodriguez-ea'),
('550e8400-e29b-41d4-a716-446655440013', '550e8400-e29b-41d4-a716-446655440003', 'Leo', 'Peterson', 'CTEC • 1040 + Schedule C', 'Seasonal tax preparer specializing in individual returns and small business schedules. Available during tax season.', 'CTEC', 'Peterson Tax Prep', 'leo@petersontax.com', '(555) 345-6789', 'https://petersontax.com', 'https://linkedin.com/in/leopeterson', false, 'verified', true, 'leo-peterson-ctec'),
('550e8400-e29b-41d4-a716-446655440014', '550e8400-e29b-41d4-a716-446655440004', 'Sarah', 'Smith', 'CPA • Real Estate & Partnership', 'Focused on real estate partnerships, 1031 exchanges, and complex partnership structures. Available for review and consultation.', 'CPA', 'Smith & Associates', 'sarah@smithcpa.com', '(555) 456-7890', 'https://smithcpa.com', 'https://linkedin.com/in/sarahsmith', true, 'verified', true, 'sarah-smith-cpa'),
('550e8400-e29b-41d4-a716-446655440015', '550e8400-e29b-41d4-a716-446655440005', 'David', 'Jones', 'EA • Crypto & International', 'Specializing in cryptocurrency taxation and international tax compliance. Expert in FBAR and FATCA reporting.', 'EA', 'Jones Tax Services', 'david@jonesea.com', '(555) 567-8901', 'https://jonestax.com', 'https://linkedin.com/in/davidjones', true, 'verified', true, 'david-jones-ea')
ON CONFLICT (id) DO NOTHING;

-- Insert profile specializations
INSERT INTO profile_specializations (profile_id, specialization_id) VALUES
-- Jordan Chan (S-Corp, Multi-State, Business)
('550e8400-e29b-41d4-a716-446655440011', (SELECT id FROM specializations WHERE slug = 's_corp')),
('550e8400-e29b-41d4-a716-446655440011', (SELECT id FROM specializations WHERE slug = 'multi_state')),
('550e8400-e29b-41d4-a716-446655440011', (SELECT id FROM specializations WHERE slug = 'business')),

-- Maya Rodriguez (IRS Representation, Individual Returns)
('550e8400-e29b-41d4-a716-446655440012', (SELECT id FROM specializations WHERE slug = 'irs_rep')),
('550e8400-e29b-41d4-a716-446655440012', (SELECT id FROM specializations WHERE slug = '1040')),

-- Leo Peterson (Individual Returns, Business Returns)
('550e8400-e29b-41d4-a716-446655440013', (SELECT id FROM specializations WHERE slug = '1040')),
('550e8400-e29b-41d4-a716-446655440013', (SELECT id FROM specializations WHERE slug = 'business')),

-- Sarah Smith (Real Estate, Partnership)
('550e8400-e29b-41d4-a716-446655440014', (SELECT id FROM specializations WHERE slug = 'real_estate')),
('550e8400-e29b-41d4-a716-446655440014', (SELECT id FROM specializations WHERE slug = 'partnership')),

-- David Jones (Crypto, International)
('550e8400-e29b-41d4-a716-446655440015', (SELECT id FROM specializations WHERE slug = 'crypto')),
('550e8400-e29b-41d4-a716-446655440015', (SELECT id FROM specializations WHERE slug = 'international'))
ON CONFLICT DO NOTHING;

-- Insert profile locations
INSERT INTO profile_locations (profile_id, location_id) VALUES
-- Jordan Chan (CA, AZ, NV)
('550e8400-e29b-41d4-a716-446655440011', (SELECT id FROM locations WHERE state = 'CA' AND city = 'Los Angeles')),
('550e8400-e29b-41d4-a716-446655440011', (SELECT id FROM locations WHERE state = 'AZ')),
('550e8400-e29b-41d4-a716-446655440011', (SELECT id FROM locations WHERE state = 'NV')),

-- Maya Rodriguez (TX)
('550e8400-e29b-41d4-a716-446655440012', (SELECT id FROM locations WHERE state = 'TX' AND city = 'Houston')),

-- Leo Peterson (CA)
('550e8400-e29b-41d4-a716-446655440013', (SELECT id FROM locations WHERE state = 'CA' AND city = 'San Francisco')),

-- Sarah Smith (NY)
('550e8400-e29b-41d4-a716-446655440014', (SELECT id FROM locations WHERE state = 'NY' AND city = 'New York')),

-- David Jones (FL)
('550e8400-e29b-41d4-a716-446655440015', (SELECT id FROM locations WHERE state = 'FL' AND city = 'Miami'))
ON CONFLICT DO NOTHING;

-- Insert sample licenses
INSERT INTO licenses (profile_id, license_kind, license_number, issuing_authority, state, status) VALUES
('550e8400-e29b-41d4-a716-446655440011', 'CPA_STATE_LICENSE', '12345', 'California Board of Accountancy', 'CA', 'verified'),
('550e8400-e29b-41d4-a716-446655440012', 'EA_ENROLLMENT', '67890', 'IRS', NULL, 'verified'),
('550e8400-e29b-41d4-a716-446655440013', 'CTEC_REG', 'CTEC123', 'CTEC', NULL, 'verified'),
('550e8400-e29b-41d4-a716-446655440014', 'CPA_STATE_LICENSE', '54321', 'New York State Board for Public Accountancy', 'NY', 'verified'),
('550e8400-e29b-41d4-a716-446655440015', 'EA_ENROLLMENT', '09876', 'IRS', NULL, 'verified')
ON CONFLICT DO NOTHING;
