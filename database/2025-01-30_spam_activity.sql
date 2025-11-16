-- Spam Activity Tracking Table
-- Stores rejected form submissions and spam attempts for monitoring
-- Date: 2025-01-30

-- =============================================
-- CREATE TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS spam_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address TEXT NOT NULL,
  endpoint TEXT NOT NULL, -- e.g., '/api/contributors/submit', '/api/events/suggest'
  reason TEXT NOT NULL, -- e.g., 'Honeypot field filled', 'Rate limit exceeded'
  user_agent TEXT,
  request_body JSONB, -- Store sanitized request data (remove sensitive fields)
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- INDEXES
-- =============================================

-- Index for monitoring by endpoint
CREATE INDEX idx_spam_activity_endpoint ON spam_activity(endpoint, created_at DESC);

-- Index for IP-based queries
CREATE INDEX idx_spam_activity_ip ON spam_activity(ip_address, created_at DESC);

-- Index for time-based queries (cleanup old data)
CREATE INDEX idx_spam_activity_created ON spam_activity(created_at DESC);

-- Composite index for admin dashboard queries
CREATE INDEX idx_spam_activity_monitoring ON spam_activity(endpoint, reason, created_at DESC);

-- =============================================
-- RLS POLICIES
-- =============================================

-- Enable RLS
ALTER TABLE spam_activity ENABLE ROW LEVEL SECURITY;

-- Only service role can read/write (admin operations)
CREATE POLICY "Service role can manage spam activity"
  ON spam_activity
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Anonymous can insert (for tracking blocked requests)
CREATE POLICY "Anyone can log spam attempts"
  ON spam_activity
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- =============================================
-- NOTES
-- =============================================

-- Usage:
-- 1. API endpoints call this to log blocked spam attempts
-- 2. Admin dashboard queries this for monitoring
-- 3. Auto-cleanup: keep data for 30-90 days
--
-- Sample query for monitoring:
-- SELECT endpoint, reason, COUNT(*) as count, MAX(created_at) as last_occurrence
-- FROM spam_activity
-- WHERE created_at > NOW() - INTERVAL '24 hours'
-- GROUP BY endpoint, reason
-- ORDER BY count DESC;
--
-- Sample cleanup (run weekly):
-- DELETE FROM spam_activity WHERE created_at < NOW() - INTERVAL '90 days';

