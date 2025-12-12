-- Normalize primary_location column in profiles table
-- Fixes inconsistent data formats: some are proper JSON objects, others are JSON strings
-- Date: 2025-01-31

-- =============================================
-- STEP 1: Create helper function to safely parse JSON strings
-- =============================================

-- Function to safely parse JSON strings, handling escaped JSON
CREATE OR REPLACE FUNCTION safe_parse_location(loc jsonb)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
  loc_text TEXT;
  parsed_json jsonb;
BEGIN
  -- If already an object, return as-is
  IF jsonb_typeof(loc) = 'object' THEN
    RETURN loc;
  END IF;
  
  -- If it's a string, try to parse it
  IF jsonb_typeof(loc) = 'string' THEN
    -- Get the string value (removes outer JSON quotes)
    loc_text := loc::text;
    
    -- Remove outer quotes if present
    IF loc_text LIKE '"%"' THEN
      loc_text := TRIM(BOTH '"' FROM loc_text);
    END IF;
    
    -- Handle escaped quotes and backslashes
    loc_text := REPLACE(loc_text, '\\"', '"');
    loc_text := REPLACE(loc_text, '\\\\', '\');
    
    -- Try to parse as JSON
    BEGIN
      parsed_json := loc_text::jsonb;
      RETURN parsed_json;
    EXCEPTION WHEN OTHERS THEN
      -- If parsing fails, return NULL
      RETURN NULL;
    END;
  END IF;
  
  -- For any other type, return NULL
  RETURN NULL;
END;
$$;

-- =============================================
-- STEP 2: Normalize all primary_location data
-- =============================================

-- This UPDATE normalizes both formats into a single, consistent JSON object:
-- - Proper JSON objects: use as-is (but normalize keys to lowercase)
-- - JSON strings: parse the inner JSON and normalize keys
-- - Result: always a clean jsonb object with lowercase keys

WITH normalized AS (
  SELECT
    id,
    safe_parse_location(primary_location) AS loc
  FROM profiles
  WHERE primary_location IS NOT NULL
)
UPDATE profiles p
SET primary_location = jsonb_build_object(
  'city',         COALESCE(
    NULLIF(TRIM(n.loc->>'city'), ''),
    NULLIF(TRIM(n.loc->>'CITY'), '')
  ),
  'state',        COALESCE(
    NULLIF(TRIM(n.loc->>'state'), ''),
    NULLIF(TRIM(n.loc->>'STATE'), '')
  ),
  'country',      COALESCE(
    NULLIF(TRIM(n.loc->>'country'), ''),
    NULLIF(TRIM(n.loc->>'COUNTRY'), ''),
    'US' -- Default to US if missing
  ),
  'display_name', COALESCE(
    NULLIF(TRIM(n.loc->>'display_name'), ''),
    NULLIF(TRIM(n.loc->>'DISPLAY_NAME'), '')
  )
)
FROM normalized n
WHERE p.id = n.id
  AND n.loc IS NOT NULL  -- Only update if we successfully parsed the location
  AND (
    -- Only update if the location needs normalization
    jsonb_typeof(p.primary_location) = 'string'
    OR p.primary_location->>'city' IS DISTINCT FROM COALESCE(
      NULLIF(TRIM(n.loc->>'city'), ''),
      NULLIF(TRIM(n.loc->>'CITY'), '')
    )
    OR p.primary_location->>'state' IS DISTINCT FROM COALESCE(
      NULLIF(TRIM(n.loc->>'state'), ''),
      NULLIF(TRIM(n.loc->>'STATE'), '')
    )
    OR p.primary_location->>'country' IS DISTINCT FROM COALESCE(
      NULLIF(TRIM(n.loc->>'country'), ''),
      NULLIF(TRIM(n.loc->>'COUNTRY'), ''),
      'US'
    )
    OR p.primary_location->>'display_name' IS DISTINCT FROM COALESCE(
      NULLIF(TRIM(n.loc->>'display_name'), ''),
      NULLIF(TRIM(n.loc->>'DISPLAY_NAME'), '')
    )
  );

-- Handle rows that couldn't be parsed - set them to NULL or default empty object
-- This ensures all rows are valid before adding the constraint
UPDATE profiles
SET primary_location = jsonb_build_object(
  'city', NULL,
  'state', NULL,
  'country', 'US',
  'display_name', NULL
)
WHERE primary_location IS NOT NULL
  AND jsonb_typeof(primary_location) <> 'object';

-- =============================================
-- STEP 3: Clean up helper function (optional - can keep for future use)
-- =============================================

-- Keep the function for potential future use, or drop it:
-- DROP FUNCTION IF EXISTS safe_parse_location(jsonb);

-- =============================================
-- STEP 4: Sanity checks
-- =============================================

-- Check: Make sure there are no more jsonb strings
DO $$
DECLARE
  string_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO string_count
  FROM profiles
  WHERE primary_location IS NOT NULL
    AND jsonb_typeof(primary_location) <> 'object';
  
  IF string_count > 0 THEN
    RAISE WARNING 'Found % profiles with primary_location still as string (not object)', string_count;
  ELSE
    RAISE NOTICE 'All primary_location values are now proper JSON objects';
  END IF;
END $$;

-- =============================================
-- STEP 5: Add constraint to prevent future issues
-- =============================================

-- All remaining string values have been cleaned up above, so we can safely add the constraint
ALTER TABLE profiles
DROP CONSTRAINT IF EXISTS primary_location_is_object;

ALTER TABLE profiles
ADD CONSTRAINT primary_location_is_object
CHECK (
  primary_location IS NULL 
  OR jsonb_typeof(primary_location) = 'object'
);

-- =============================================
-- STEP 6: Add index for faster state queries
-- =============================================

-- Create GIN index for faster querying by state
-- This allows queries like: WHERE primary_location->>'state' = 'AL'
CREATE INDEX IF NOT EXISTS idx_profiles_primary_location_state
ON profiles ((primary_location->>'state'))
WHERE primary_location IS NOT NULL 
  AND primary_location->>'state' IS NOT NULL;

-- Also add index for country
CREATE INDEX IF NOT EXISTS idx_profiles_primary_location_country
ON profiles ((primary_location->>'country'))
WHERE primary_location IS NOT NULL 
  AND primary_location->>'country' IS NOT NULL;

-- =============================================
-- STEP 7: Sample verification query
-- =============================================

-- Uncomment to inspect a sample after running:
-- SELECT 
--   id,
--   first_name,
--   last_name,
--   primary_location,
--   jsonb_typeof(primary_location) as location_type
-- FROM profiles
-- WHERE primary_location IS NOT NULL
-- LIMIT 20;

