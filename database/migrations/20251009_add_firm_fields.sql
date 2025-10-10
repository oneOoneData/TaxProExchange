-- Add firm size and annual returns range fields to profiles table
-- Migration: 20251009_add_firm_fields.sql

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS firm_size text NULL,
  ADD COLUMN IF NOT EXISTS annual_returns_range text NULL;

-- Add CHECK constraints to restrict to allowed values
ALTER TABLE profiles
  ADD CONSTRAINT chk_profiles_firm_size
    CHECK (firm_size IN ('solo_1','2_5','6_10','11_20','21_50','50_plus') OR firm_size IS NULL);

ALTER TABLE profiles
  ADD CONSTRAINT chk_profiles_annual_returns_range
    CHECK (annual_returns_range IN ('lt_100','100_999','1000_4999','5000_plus') OR annual_returns_range IS NULL);

-- Add comments for documentation
COMMENT ON COLUMN profiles.firm_size IS 'Total number of members in the firm: solo_1, 2_5, 6_10, 11_20, 21_50, 50_plus';
COMMENT ON COLUMN profiles.annual_returns_range IS 'Total number of returns per year: lt_100, 100_999, 1000_4999, 5000_plus';

