-- Add Slack members table for tracking verified users who have joined the private Slack workspace
-- This table tracks which verified profiles have joined the private Slack community

CREATE TABLE IF NOT EXISTS public.slack_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  slack_user_id TEXT,
  joined_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.slack_members ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read their own slack_members record
CREATE POLICY "owner can read own slack_members"
ON public.slack_members FOR SELECT
USING (profile_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

-- Policy: Users can insert their own slack_members record
CREATE POLICY "owner can insert own slack_members"
ON public.slack_members FOR INSERT 
WITH CHECK (profile_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

-- Policy: Users can update their own slack_members record
CREATE POLICY "owner can update own slack_members"
ON public.slack_members FOR UPDATE 
USING (profile_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

-- Policy: Admins can read all slack_members records
CREATE POLICY "admins can read all slack_members"
ON public.slack_members FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND is_admin = true
  )
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_slack_members_profile_id ON public.slack_members(profile_id);
CREATE INDEX IF NOT EXISTS idx_slack_members_joined_at ON public.slack_members(joined_at);

-- Add rate limiting table for join attempts
CREATE TABLE IF NOT EXISTS public.slack_join_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  attempted_at TIMESTAMPTZ DEFAULT NOW(),
  success BOOLEAN DEFAULT FALSE
);

-- Enable RLS for rate limiting table
ALTER TABLE public.slack_join_attempts ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read their own join attempts
CREATE POLICY "owner can read own slack_join_attempts"
ON public.slack_join_attempts FOR SELECT
USING (profile_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

-- Policy: Users can insert their own join attempts
CREATE POLICY "owner can insert own slack_join_attempts"
ON public.slack_join_attempts FOR INSERT 
WITH CHECK (profile_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

-- Create index for rate limiting queries
CREATE INDEX IF NOT EXISTS idx_slack_join_attempts_profile_id ON public.slack_join_attempts(profile_id);
CREATE INDEX IF NOT EXISTS idx_slack_join_attempts_attempted_at ON public.slack_join_attempts(attempted_at);
