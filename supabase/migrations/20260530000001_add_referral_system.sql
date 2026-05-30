-- Referral Marketplace — anyone can refer, anyone can get paid

-- A referral: User A sends a lead to User B with a fee
CREATE TABLE IF NOT EXISTS referrals (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  referrer_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  recipient_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  client_name text NOT NULL,
  client_info text,  -- contact details, scope of work
  fee_amount integer NOT NULL,  -- in cents ($30 = 3000)
  platform_cut_percent integer NOT NULL DEFAULT 10,  -- 10% to platform
  status text NOT NULL DEFAULT 'pending' 
    CHECK (status IN ('pending', 'accepted', 'declined', 'completed', 'cancelled')),
  message text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  accepted_at timestamptz,
  completed_at timestamptz,
  -- Stripe payment tracking (wired in when Koen sets up Connect)
  stripe_payment_intent_id text,
  stripe_transfer_id text,
  referrer_paid boolean NOT NULL DEFAULT false
);

-- Track payouts to referrers
CREATE TABLE IF NOT EXISTS referral_payouts (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  referral_id uuid NOT NULL REFERENCES referrals(id) ON DELETE CASCADE,
  profile_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  amount integer NOT NULL,  -- cents (fee - platform cut)
  stripe_account_id text,  -- Stripe Connect account ID of the referrer
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'paid', 'failed')),
  paid_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Track Stripe Connect accounts (users who want to get paid)
CREATE TABLE IF NOT EXISTS stripe_connect_accounts (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  stripe_account_id text NOT NULL,  -- acct_xxx from Stripe Connect
  onboarded boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON referrals(referrer_id, status);
CREATE INDEX IF NOT EXISTS idx_referrals_recipient ON referrals(recipient_id, status);
CREATE INDEX IF NOT EXISTS idx_referral_payouts_profile ON referral_payouts(profile_id);
