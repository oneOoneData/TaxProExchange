-- Remove legacy email field from profiles table
-- This field was replaced by public_email and is no longer used

-- First, update the policy that depends on the email field
DROP POLICY IF EXISTS "firm_member_invitations_update" ON firm_member_invitations;

-- Recreate the policy using only public_email
CREATE POLICY "firm_member_invitations_update" 
  ON firm_member_invitations FOR UPDATE 
  USING (
    invited_profile_id = auth_profile_id()
    OR invited_email IN (
      SELECT public_email FROM profiles WHERE id = auth_profile_id()
    )
  );

-- Now drop the legacy email column
ALTER TABLE profiles DROP COLUMN IF EXISTS email;

-- Add comment to document the change
COMMENT ON TABLE profiles IS 'Profiles table - uses public_email field for email addresses';
