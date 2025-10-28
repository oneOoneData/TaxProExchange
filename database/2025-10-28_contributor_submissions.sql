-- Contributor Submissions Table
-- Stores article submissions from external contributors
-- Date: 2025-10-28

-- =============================================
-- CREATE TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS contributor_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  firm TEXT,
  title TEXT NOT NULL,
  topic TEXT NOT NULL,
  draft_url TEXT,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'published')),
  article_slug TEXT, -- populated when approved
  ip_address TEXT, -- for rate limiting
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID -- references profiles(id) or admin user
);

-- =============================================
-- INDEXES
-- =============================================

-- Index for admin review dashboard
CREATE INDEX idx_contributor_submissions_status ON contributor_submissions(status, created_at DESC);

-- Index for email lookup (duplicate prevention)
CREATE INDEX idx_contributor_submissions_email ON contributor_submissions(email, created_at DESC);

-- Index for IP-based rate limiting
CREATE INDEX idx_contributor_submissions_ip ON contributor_submissions(ip_address, created_at DESC);

-- Index for slug lookup
CREATE INDEX idx_contributor_submissions_slug ON contributor_submissions(article_slug) WHERE article_slug IS NOT NULL;

-- =============================================
-- RLS POLICIES
-- =============================================

-- Enable RLS
ALTER TABLE contributor_submissions ENABLE ROW LEVEL SECURITY;

-- Public can insert (for form submissions)
CREATE POLICY "Anyone can submit contributor applications"
  ON contributor_submissions
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Only service role can read/update (admin operations)
CREATE POLICY "Service role can manage submissions"
  ON contributor_submissions
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- =============================================
-- UPDATED_AT TRIGGER
-- =============================================

CREATE OR REPLACE FUNCTION update_contributor_submissions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_contributor_submissions_updated_at
  BEFORE UPDATE ON contributor_submissions
  FOR EACH ROW
  EXECUTE FUNCTION update_contributor_submissions_updated_at();

-- =============================================
-- NOTES
-- =============================================

-- Flow:
-- 1. Public submits via /ai/write-for-us form
-- 2. API inserts with status='pending'
-- 3. Admin reviews in /admin/contributors
-- 4. Approve → status='approved', article_slug populated
-- 5. When article published → status='published', trigger email notification
--
-- Rate limiting:
-- - Check for duplicate email within 7 days
-- - Track IP address for abuse prevention
--
-- Security:
-- - RLS ensures only service role can view submissions
-- - Form uses public anon key for inserts only

