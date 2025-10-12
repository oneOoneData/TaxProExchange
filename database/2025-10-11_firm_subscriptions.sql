-- Firm Subscriptions Migration
-- Adds Stripe subscription management to firms
-- Non-breaking: only adds columns and tables

-- =============================================
-- Add subscription fields to firms table
-- =============================================

-- Add subscription-related columns to firms
ALTER TABLE firms
  ADD COLUMN IF NOT EXISTS subscription_status text 
    CHECK (subscription_status IN ('active', 'inactive', 'past_due', 'canceled', 'trialing'))
    DEFAULT 'inactive',
  ADD COLUMN IF NOT EXISTS stripe_customer_id text UNIQUE,
  ADD COLUMN IF NOT EXISTS stripe_subscription_id text UNIQUE,
  ADD COLUMN IF NOT EXISTS subscription_started_at timestamptz,
  ADD COLUMN IF NOT EXISTS subscription_current_period_end timestamptz,
  ADD COLUMN IF NOT EXISTS trial_ends_at timestamptz;

-- Index for quick subscription status lookups
CREATE INDEX IF NOT EXISTS idx_firms_subscription_status 
  ON firms (subscription_status);

CREATE INDEX IF NOT EXISTS idx_firms_stripe_customer_id 
  ON firms (stripe_customer_id) 
  WHERE stripe_customer_id IS NOT NULL;

-- =============================================
-- TABLE: firm_subscription_events
-- Audit log for subscription changes
-- =============================================

CREATE TABLE IF NOT EXISTS firm_subscription_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  firm_id uuid NOT NULL REFERENCES firms(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  stripe_event_id text,
  previous_status text,
  new_status text,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_subscription_events_firm 
  ON firm_subscription_events (firm_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_subscription_events_stripe 
  ON firm_subscription_events (stripe_event_id) 
  WHERE stripe_event_id IS NOT NULL;

-- =============================================
-- FUNCTION: Helper to check if firm has active subscription
-- =============================================

CREATE OR REPLACE FUNCTION firm_has_active_subscription(firm_uuid uuid) 
RETURNS boolean
LANGUAGE sql STABLE AS $$
  SELECT EXISTS (
    SELECT 1 FROM firms
    WHERE id = firm_uuid
      AND subscription_status IN ('active', 'trialing')
      AND (
        subscription_current_period_end IS NULL 
        OR subscription_current_period_end > now()
      )
  );
$$;

-- =============================================
-- FUNCTION: Helper to get user's firms with active subscriptions
-- =============================================

CREATE OR REPLACE FUNCTION user_active_firm_ids(profile_uuid uuid) 
RETURNS TABLE(firm_id uuid)
LANGUAGE sql STABLE AS $$
  SELECT f.id
  FROM firms f
  INNER JOIN firm_members fm ON fm.firm_id = f.id
  WHERE fm.profile_id = profile_uuid
    AND fm.status = 'active'
    AND f.subscription_status IN ('active', 'trialing')
    AND (
      f.subscription_current_period_end IS NULL 
      OR f.subscription_current_period_end > now()
    );
$$;

-- =============================================
-- COMMENTS
-- =============================================

COMMENT ON COLUMN firms.subscription_status IS 'Stripe subscription status: active, inactive, past_due, canceled, trialing';
COMMENT ON COLUMN firms.stripe_customer_id IS 'Stripe customer ID for billing';
COMMENT ON COLUMN firms.stripe_subscription_id IS 'Stripe subscription ID';
COMMENT ON COLUMN firms.subscription_started_at IS 'When the subscription first started';
COMMENT ON COLUMN firms.subscription_current_period_end IS 'End of current billing period';
COMMENT ON COLUMN firms.trial_ends_at IS 'End of trial period (if applicable)';

COMMENT ON TABLE firm_subscription_events IS 'Audit log for all subscription-related events';
COMMENT ON FUNCTION firm_has_active_subscription(uuid) IS 'Returns true if firm has an active or trialing subscription';
COMMENT ON FUNCTION user_active_firm_ids(uuid) IS 'Returns list of firm IDs where user is an active member with active subscription';

