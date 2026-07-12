-- Enable RLS on tables flagged by Supabase security linter.
-- All app access goes through supabaseService() (service role), which bypasses
-- RLS automatically — so enabling RLS here closes public exposure without
-- breaking any existing functionality.

-- match_config: single-row admin config; allow authenticated reads, block writes
ALTER TABLE public.match_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read match config"
  ON public.match_config FOR SELECT
  TO authenticated
  USING (true);

-- match_history: personal per-user data; no direct client access needed
ALTER TABLE public.match_history ENABLE ROW LEVEL SECURITY;

-- referrals: sensitive financial records; no direct client access needed
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

-- referral_payouts: sensitive payout data; no direct client access needed
ALTER TABLE public.referral_payouts ENABLE ROW LEVEL SECURITY;

-- stripe_connect_accounts: Stripe account IDs; no direct client access needed
ALTER TABLE public.stripe_connect_accounts ENABLE ROW LEVEL SECURITY;

-- practice_listing_views: analytics tracking; no direct client access needed
ALTER TABLE public.practice_listing_views ENABLE ROW LEVEL SECURITY;
