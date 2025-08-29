-- Fix Profile Slugs Migration
-- Generate proper slugs for all profiles that don't have them

-- First, let's see what profiles are missing slugs or have malformed data
SELECT 
  id, 
  first_name, 
  last_name, 
  slug,
  visibility_state,
  is_listed
FROM profiles 
WHERE slug IS NULL OR slug = '' OR slug LIKE '%-%' AND slug NOT SIMILAR TO '[a-z0-9-]+';

-- Clean up any malformed existing slugs
UPDATE profiles 
SET slug = NULL 
WHERE slug IS NOT NULL AND (slug = '' OR slug NOT SIMILAR TO '[a-z0-9-]+');

-- Generate slugs for profiles that don't have them
-- Use a simpler approach without REGEXP_REPLACE
UPDATE profiles 
SET slug = CASE
  WHEN first_name IS NOT NULL AND first_name != '' AND last_name IS NOT NULL AND last_name != '' THEN
    LOWER(
      CONCAT(
        REPLACE(REPLACE(REPLACE(REPLACE(first_name, ' ', ''), '-', ''), '_', ''), '.', ''),
        '-',
        REPLACE(REPLACE(REPLACE(REPLACE(last_name, ' ', ''), '-', ''), '_', ''), '.', ''),
        '-',
        SUBSTRING(id::text, 1, 8)
      )
    )
  WHEN first_name IS NOT NULL AND first_name != '' THEN
    LOWER(
      CONCAT(
        REPLACE(REPLACE(REPLACE(REPLACE(first_name, ' ', ''), '-', ''), '_', ''), '.', ''),
        '-',
        SUBSTRING(id::text, 1, 12)
      )
    )
  ELSE
    LOWER(
      CONCAT('user-', SUBSTRING(id::text, 1, 16))
    )
END
WHERE slug IS NULL OR slug = '';

-- Handle duplicate slugs by adding a counter
-- First, create a temporary table to identify duplicates
CREATE TEMP TABLE duplicate_slugs AS
SELECT slug, COUNT(*) as count
FROM profiles 
WHERE slug IS NOT NULL
GROUP BY slug 
HAVING COUNT(*) > 1;

-- Update profiles with duplicate slugs, adding a counter
-- We'll do this in a loop for each duplicate slug
DO $$
DECLARE
    dup_slug TEXT;
    counter INTEGER;
    profile_id UUID;
BEGIN
    FOR dup_slug IN SELECT slug FROM duplicate_slugs LOOP
        counter := 1;
        FOR profile_id IN 
            SELECT id FROM profiles 
            WHERE slug = dup_slug 
            ORDER BY created_at
        LOOP
            IF counter > 1 THEN
                UPDATE profiles 
                SET slug = dup_slug || '-' || (counter - 1)
                WHERE id = profile_id;
            END IF;
            counter := counter + 1;
        END LOOP;
    END LOOP;
END $$;

-- Drop the temporary table
DROP TABLE duplicate_slugs;

-- Verify the results
SELECT 
  id, 
  first_name, 
  last_name, 
  slug,
  visibility_state,
  is_listed
FROM profiles 
ORDER BY created_at;

-- Handle constraints - drop existing and recreate
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS unique_profile_slug;
ALTER TABLE profiles ADD CONSTRAINT unique_profile_slug UNIQUE (slug);

-- Create an index on slug for better performance (ignore if exists)
CREATE INDEX IF NOT EXISTS idx_profiles_slug ON profiles(slug);
