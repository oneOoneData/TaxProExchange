-- Query all profiles that have a website
-- Shows key profile information for profiles with a website_url

SELECT 
    p.id,
    p.first_name,
    p.last_name,
    p.credential_type,
    p.firm_name,
    p.website_url,
    p.linkedin_url,
    p.slug,
    p.is_listed,
    p.visibility_state,
    p.created_at
FROM profiles p
WHERE p.website_url IS NOT NULL 
  AND p.website_url != ''
  AND p.website_url != 'https://'
ORDER BY p.created_at DESC;

