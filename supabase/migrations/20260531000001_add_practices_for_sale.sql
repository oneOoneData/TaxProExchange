-- Practices for Sale Board
-- Sellers list practices for free, buyers pay $150/month to access contact info

-- Practice listings table
CREATE TABLE IF NOT EXISTS practice_listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Seller identity (NEVER returned to non-paying users)
  seller_user_id UUID REFERENCES auth.users(id),
  seller_name TEXT NOT NULL,
  firm_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  city TEXT NOT NULL,

  -- Public details (shown to all)
  state TEXT NOT NULL,
  years_established INT NOT NULL,
  annual_revenue_min INT NOT NULL,
  annual_revenue_max INT NOT NULL,
  client_count_min INT NOT NULL,
  client_count_max INT NOT NULL,
  revenue_pct_tax INT DEFAULT 0,
  revenue_pct_bookkeeping INT DEFAULT 0,
  revenue_pct_advisory INT DEFAULT 0,
  staff_count INT DEFAULT 0,
  specialties TEXT[],
  software_stack TEXT[],
  asking_price_min INT,
  asking_price_max INT,
  reason_for_sale TEXT,
  remote_friendly BOOLEAN DEFAULT FALSE,
  seller_financing BOOLEAN DEFAULT FALSE,
  additional_notes TEXT,

  -- Status & expiry
  status TEXT DEFAULT 'pending',
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '90 days')
);

-- Buyer access table
CREATE TABLE IF NOT EXISTS practice_buyer_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) UNIQUE,
  stripe_subscription_id TEXT,
  stripe_customer_id TEXT,
  access_start TIMESTAMPTZ DEFAULT NOW(),
  access_end TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days'),
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- View tracking for analytics
CREATE TABLE IF NOT EXISTS practice_listing_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID REFERENCES practice_listings(id),
  viewer_user_id UUID REFERENCES auth.users(id),
  viewed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_practice_listings_status ON practice_listings(status);
CREATE INDEX IF NOT EXISTS idx_practice_listings_state ON practice_listings(state);
CREATE INDEX IF NOT EXISTS idx_practice_listings_seller ON practice_listings(seller_user_id);
CREATE INDEX IF NOT EXISTS idx_practice_buyer_access_user ON practice_buyer_access(user_id);
CREATE INDEX IF NOT EXISTS idx_practice_listing_views_listing ON practice_listing_views(listing_id);

-- RLS
ALTER TABLE practice_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE practice_buyer_access ENABLE ROW LEVEL SECURITY;

-- Sellers manage own listings
CREATE POLICY "Sellers can manage own listings"
  ON practice_listings FOR ALL
  USING (auth.uid() = seller_user_id);

-- Buyers read own access
CREATE POLICY "Buyers can read own access"
  ON practice_buyer_access FOR SELECT
  USING (auth.uid() = user_id);
