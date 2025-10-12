-- Firm Member Invitations
-- Allow admins to invite team members to help manage the firm

-- =============================================
-- TABLE: firm_member_invitations
-- =============================================

CREATE TABLE IF NOT EXISTS firm_member_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  firm_id uuid NOT NULL REFERENCES firms(id) ON DELETE CASCADE,
  invited_email text NOT NULL,
  invited_profile_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  role text NOT NULL CHECK (role IN ('admin', 'manager', 'member')),
  invited_by_profile_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  message text,
  status text NOT NULL CHECK (status IN ('pending', 'accepted', 'declined', 'expired')) DEFAULT 'pending',
  token text UNIQUE NOT NULL,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  accepted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_firm_member_invitations_firm 
  ON firm_member_invitations (firm_id, status);

CREATE INDEX IF NOT EXISTS idx_firm_member_invitations_email 
  ON firm_member_invitations (invited_email, status);

CREATE INDEX IF NOT EXISTS idx_firm_member_invitations_token 
  ON firm_member_invitations (token) 
  WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_firm_member_invitations_expires 
  ON firm_member_invitations (expires_at) 
  WHERE status = 'pending';

-- Trigger for updated_at
CREATE TRIGGER firm_member_invitations_updated_at 
  BEFORE UPDATE ON firm_member_invitations
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies
ALTER TABLE firm_member_invitations ENABLE ROW LEVEL SECURITY;

-- Admins and managers can view invitations for their firms
CREATE POLICY "firm_member_invitations_select" 
  ON firm_member_invitations FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM firm_members fm
      WHERE fm.firm_id = firm_member_invitations.firm_id
        AND fm.profile_id = auth_profile_id()
        AND fm.status = 'active'
        AND fm.role IN ('admin', 'manager')
    )
  );

-- Admins and managers can create invitations
CREATE POLICY "firm_member_invitations_insert" 
  ON firm_member_invitations FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM firm_members fm
      WHERE fm.firm_id = firm_member_invitations.firm_id
        AND fm.profile_id = auth_profile_id()
        AND fm.status = 'active'
        AND fm.role IN ('admin', 'manager')
    )
  );

-- Users can update their own invitations (accept/decline)
CREATE POLICY "firm_member_invitations_update" 
  ON firm_member_invitations FOR UPDATE 
  USING (
    invited_profile_id = auth_profile_id()
    OR invited_email IN (
      SELECT public_email FROM profiles WHERE id = auth_profile_id()
    )
    OR invited_email IN (
      SELECT email FROM profiles WHERE id = auth_profile_id()
    )
  );

-- Comments
COMMENT ON TABLE firm_member_invitations IS 'Invitations for users to join a firm as team members (not bench professionals)';
COMMENT ON COLUMN firm_member_invitations.invited_email IS 'Email address of person being invited';
COMMENT ON COLUMN firm_member_invitations.invited_profile_id IS 'Profile ID if user already has an account';
COMMENT ON COLUMN firm_member_invitations.role IS 'Role they will have: admin, manager, or member';
COMMENT ON COLUMN firm_member_invitations.token IS 'Unique token for invitation acceptance link';
COMMENT ON COLUMN firm_member_invitations.expires_at IS 'Invitation expires after 7 days';

