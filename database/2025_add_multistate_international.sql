-- Add multi-state and international work capabilities to profiles table
-- This migration adds boolean flags and country arrays for tax professionals

-- 1. Add new columns for multi-state and international work
ALTER TABLE profiles 
  ADD COLUMN IF NOT EXISTS works_multistate BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS works_international BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS countries TEXT[] NOT NULL DEFAULT '{}';

-- 2. Create indexes for performance on the new fields
CREATE INDEX IF NOT EXISTS idx_profiles_works_multistate ON profiles(works_multistate);
CREATE INDEX IF NOT EXISTS idx_profiles_works_international ON profiles(works_international);
CREATE INDEX IF NOT EXISTS idx_profiles_countries ON profiles USING GIN(countries);

-- 3. Add comments to document the column purposes
COMMENT ON COLUMN profiles.works_multistate IS 'When true, professional serves all U.S. states regardless of individual state selections';
COMMENT ON COLUMN profiles.works_international IS 'When true, professional serves international clients';
COMMENT ON COLUMN profiles.countries IS 'Array of ISO-3166-1 alpha-2 country codes where professional can work internationally';

-- 4. Update existing profiles to have explicit values
UPDATE profiles SET 
  works_multistate = false,
  works_international = false,
  countries = '{}'
WHERE works_multistate IS NULL OR works_international IS NULL OR countries IS NULL;

-- 5. Verify the migration
SELECT 
  'Migration completed successfully' as status,
  COUNT(*) as total_profiles,
  COUNT(CASE WHEN works_multistate = true THEN 1 END) as multistate_profiles,
  COUNT(CASE WHEN works_international = true THEN 1 END) as international_profiles,
  COUNT(CASE WHEN array_length(countries, 1) > 0 THEN 1 END) as profiles_with_countries
FROM profiles;
