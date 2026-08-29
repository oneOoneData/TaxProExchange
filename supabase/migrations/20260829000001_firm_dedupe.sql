-- Prevent duplicate firm workspaces from the same owner.
--
-- Context: the firm-creation flow (POST /api/firms -> POST /api/stripe/create-checkout-session)
-- creates the firms row in step 1, then redirects to Stripe in step 2. When step 2 failed
-- (profile lookup mismatch, empty customer_email), users saw an error, assumed the whole
-- thing failed, and re-submitted -- each retry created another orphan firm. One user created
-- the same firm 11 times in 5 minutes; there are other 3x "Test Firm" clusters from the same
-- day. App-level idempotency is added in /api/firms; this migration adds a DB backstop plus a
-- one-time cleanup of the orphan clusters.

-- 1. Track who created each firm (nullable; existing rows backfilled from the admin member).
ALTER TABLE firms
  ADD COLUMN IF NOT EXISTS created_by_profile_id uuid REFERENCES profiles(id) ON DELETE SET NULL;

-- 2. Backfill from the earliest active admin member.
UPDATE firms f
SET created_by_profile_id = fm.profile_id
FROM (
  SELECT DISTINCT ON (firm_id) firm_id, profile_id
  FROM firm_members
  WHERE role = 'admin' AND status = 'active'
  ORDER BY firm_id, created_at
) fm
WHERE fm.firm_id = f.id
  AND f.created_by_profile_id IS NULL;

-- 3. One-time cleanup: collapse duplicate (owner, name) clusters where EVERY row is an
--    unmistakable orphan -- no Stripe customer, no live subscription, no trusted-bench
--    entries. Keep the earliest firm; delete the rest (firm_members / firm_trusted_bench
--    rows cascade). Clusters where any row has Stripe linkage or bench data are left
--    untouched for a human to resolve.
WITH ranked AS (
  SELECT
    f.id,
    f.created_by_profile_id,
    lower(f.name) AS lname,
    row_number() OVER (
      PARTITION BY f.created_by_profile_id, lower(f.name)
      ORDER BY f.created_at
    ) AS rn,
    count(*)      OVER (PARTITION BY f.created_by_profile_id, lower(f.name)) AS grp_size,
    bool_or(
      f.stripe_customer_id IS NOT NULL
      OR COALESCE(f.subscription_status, 'inactive') NOT IN ('inactive', 'canceled')
      OR EXISTS (SELECT 1 FROM firm_trusted_bench b WHERE b.firm_id = f.id)
    ) OVER (PARTITION BY f.created_by_profile_id, lower(f.name)) AS grp_has_value
  FROM firms f
  WHERE f.created_by_profile_id IS NOT NULL
)
DELETE FROM firms
WHERE id IN (
  SELECT id FROM ranked
  WHERE grp_size > 1 AND grp_has_value = false AND rn > 1
);

-- 4. Abort with a helpful list if any real duplicates remain (Stripe-linked or bench data).
DO $$
DECLARE
  dupe_list text;
BEGIN
  SELECT string_agg(
           format('  owner=%s name=%L count=%s', created_by_profile_id, lower(name), count(*)),
           E'\n'
         )
  INTO dupe_list
  FROM firms
  WHERE created_by_profile_id IS NOT NULL
  GROUP BY created_by_profile_id, lower(name)
  HAVING count(*) > 1;

  IF dupe_list IS NOT NULL THEN
    RAISE EXCEPTION E'firms_owner_name_uniq blocked -- resolve these duplicate groups first:\n%', dupe_list;
  END IF;
END $$;

-- 5. One firm per (owner, case-insensitive name). Partial: only enforced once we know the owner.
CREATE UNIQUE INDEX IF NOT EXISTS firms_owner_name_uniq
  ON firms (created_by_profile_id, lower(name))
  WHERE created_by_profile_id IS NOT NULL;

COMMENT ON INDEX firms_owner_name_uniq IS
  'Backstop against duplicate firm workspaces from repeated form submissions; see /api/firms idempotency check.';
