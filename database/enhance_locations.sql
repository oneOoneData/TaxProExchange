-- Enhance location system for better user discovery
-- This adds city-level locations and improves international support

-- 1. Add city column to profile_locations if it doesn't exist
ALTER TABLE profile_locations 
ADD COLUMN IF NOT EXISTS city TEXT;

-- 2. Add primary_location to profiles for main location display
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS primary_location JSONB DEFAULT '{
  "country": "US",
  "state": null,
  "city": null,
  "display_name": null
}'::jsonb;

-- 3. Add location_radius for service area coverage (in miles)
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS location_radius INTEGER DEFAULT 50;

-- 4. Create index for location-based searches
CREATE INDEX IF NOT EXISTS idx_profile_locations_state_city ON profile_locations(state, city);
CREATE INDEX IF NOT EXISTS idx_profiles_primary_location ON profiles USING GIN(primary_location);

-- 5. Add comments to document the new fields
COMMENT ON COLUMN profile_locations.city IS 'City name for more precise location targeting';
COMMENT ON COLUMN profiles.primary_location IS 'JSON object containing the main location for display purposes';
COMMENT ON COLUMN profiles.location_radius IS 'Service radius in miles from primary location';

-- 6. Update existing profile_locations to have city as NULL if not set
UPDATE profile_locations SET city = NULL WHERE city IS NULL;

-- 7. Create a view for easier location-based queries
CREATE OR REPLACE VIEW profile_locations_view AS
SELECT 
  p.id as profile_id,
  p.first_name,
  p.last_name,
  p.firm_name,
  p.primary_location,
  p.works_multistate,
  p.works_international,
  p.countries,
  p.location_radius,
  pl.state,
  pl.city,
  CASE 
    WHEN p.works_multistate THEN 'All US States'
    WHEN p.works_international THEN 'International'
    ELSE COALESCE(pl.state, 'Remote')
  END as service_area
FROM profiles p
LEFT JOIN profile_locations pl ON p.id = pl.profile_id
WHERE p.visibility_state = 'verified' AND p.is_listed = true;
