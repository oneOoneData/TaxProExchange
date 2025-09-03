-- Add experience and entity revenue fields to profiles table
-- Run this in your Supabase SQL Editor

-- Add new fields to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS years_experience TEXT CHECK (years_experience IN ('1-2', '3-5', '6-10', '11-15', '16-20', '21-25', '26-30', '31+')),
ADD COLUMN IF NOT EXISTS entity_revenue_range TEXT CHECK (entity_revenue_range IN ('< $1M', '$1M - $10M', '$10M - $50M', '$50M - $100M', '$100M - $500M', '$500M - $1B', '> $1B'));

-- Add comment to explain the fields
COMMENT ON COLUMN profiles.years_experience IS 'Number of years of experience in tax (mandatory for new users)';
COMMENT ON COLUMN profiles.entity_revenue_range IS 'Average annual revenue of entity clients (optional)';
