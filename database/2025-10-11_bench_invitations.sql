-- Bench Invitations Migration
-- Enables request/accept workflow for firm team building
-- Additive only: no drops, no breaking changes

-- =============================================
-- TABLE: bench_invitations
-- =============================================
create table if not exists bench_invitations (
  id uuid primary key default gen_random_uuid(),
  firm_id uuid not null references firms(id) on delete cascade,
  profile_id uuid not null references profiles(id) on delete cascade,
  invited_by_profile_id uuid not null references profiles(id) on delete cascade,
  
  -- Invitation content
  message text,
  custom_title_offer text,
  categories_suggested text[],
  
  -- Status tracking
  status text not null check (status in ('pending', 'accepted', 'declined', 'expired', 'cancelled')),
  
  -- Timestamps
  created_at timestamptz not null default now(),
  responded_at timestamptz,
  expires_at timestamptz not null default (now() + interval '30 days'),
  
  -- Response details
  response_note text
);

-- Indexes
create index if not exists idx_bench_invitations_firm on bench_invitations (firm_id, status);
create index if not exists idx_bench_invitations_profile on bench_invitations (profile_id, status);
create index if not exists idx_bench_invitations_created on bench_invitations (created_at desc);

-- Prevent multiple pending invitations for same firm+profile
create unique index if not exists idx_bench_invitations_unique_pending
  on bench_invitations (firm_id, profile_id)
  where status = 'pending';

-- =============================================
-- RLS POLICIES
-- =============================================

alter table bench_invitations enable row level security;

-- Firm members can view invitations for their firms
create policy "Firm members can view their firm invitations"
  on bench_invitations for select
  using (
    exists (
      select 1 from firm_members
      where firm_members.firm_id = bench_invitations.firm_id
        and firm_members.profile_id = auth.uid()
        and firm_members.status = 'active'
    )
  );

-- Invited profiles can view their invitations
create policy "Profiles can view invitations sent to them"
  on bench_invitations for select
  using (profile_id = auth.uid());

-- Firm admins/managers can create invitations
create policy "Firm admins can create invitations"
  on bench_invitations for insert
  with check (
    exists (
      select 1 from firm_members
      where firm_members.firm_id = bench_invitations.firm_id
        and firm_members.profile_id = auth.uid()
        and firm_members.status = 'active'
        and firm_members.role in ('admin', 'manager')
    )
  );

-- Invited profiles can update (respond to) their invitations
create policy "Profiles can respond to invitations"
  on bench_invitations for update
  using (profile_id = auth.uid())
  with check (profile_id = auth.uid());

-- Firm admins can cancel invitations
create policy "Firm admins can cancel invitations"
  on bench_invitations for update
  using (
    exists (
      select 1 from firm_members
      where firm_members.firm_id = bench_invitations.firm_id
        and firm_members.profile_id = auth.uid()
        and firm_members.status = 'active'
        and firm_members.role in ('admin', 'manager')
    )
  );

-- =============================================
-- TRIGGERS
-- =============================================

-- Trigger to update updated_at (if we add that column)
-- Note: We're using responded_at instead for this table

-- =============================================
-- FUNCTIONS
-- =============================================

-- Auto-expire old pending invitations (optional background job)
create or replace function expire_old_invitations()
returns void
language plpgsql
security definer
as $$
begin
  update bench_invitations
  set status = 'expired'
  where status = 'pending'
    and expires_at < now();
end;
$$;

-- =============================================
-- COMMENTS
-- =============================================
comment on table bench_invitations is 
  'Invitations from firms to professionals to join their trusted bench. Supports request/accept workflow.';

comment on column bench_invitations.message is 
  'Personal message from firm to professional';

comment on column bench_invitations.custom_title_offer is 
  'Suggested role/title for the professional (e.g., "IRS Representation Specialist")';

comment on column bench_invitations.expires_at is 
  'Invitation expires after 30 days if not responded to';


