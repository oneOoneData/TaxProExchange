-- Set current user as admin
-- Run this in your Supabase SQL Editor after replacing 'your-email@example.com' with your actual email

-- First, add the is_admin column if it doesn't exist
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_admin BOOLEAN NOT NULL DEFAULT false;

-- Create index for admin queries
CREATE INDEX IF NOT EXISTS idx_profiles_is_admin ON profiles(is_admin);

-- Set your user as admin (replace with your actual email)
UPDATE profiles 
SET is_admin = true 
WHERE public_email = 'your-email@example.com';  -- Replace with your email

-- Verify the update
SELECT 
    first_name, 
    last_name, 
    public_email, 
    is_admin 
FROM profiles 
WHERE public_email = 'your-email@example.com';  -- Replace with your email

-- Show all admin users
SELECT 
    first_name, 
    last_name, 
    public_email, 
    is_admin 
FROM profiles 
WHERE is_admin = true;
