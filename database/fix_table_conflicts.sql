-- Fix table conflicts for NextAuth + Supabase Adapter setup
-- Run this in your Supabase SQL Editor AFTER creating the NextAuth tables

-- 1. Drop the old custom users table (since NextAuth will manage users)
DROP TABLE IF EXISTS public.users CASCADE;

-- 2. Update profiles table to reference NextAuth users (if it exists)
-- Note: This assumes you want profiles to reference NextAuth users
-- If you prefer to keep profiles separate, you can skip this step

-- First, check if profiles table exists and has user_id column
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'profiles'
    ) THEN
        -- Drop existing foreign key constraint if it exists
        ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_user_id_fkey;
        
        -- Add new foreign key constraint to NextAuth users
        ALTER TABLE public.profiles 
        ADD CONSTRAINT profiles_user_fk 
        FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
        
        RAISE NOTICE 'Updated profiles table foreign key to reference NextAuth users';
    ELSE
        RAISE NOTICE 'Profiles table does not exist, skipping foreign key update';
    END IF;
END $$;

-- 3. Clean up any other references to the old users table
-- Add more cleanup statements here if needed
