import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createServerClient } from '@/lib/supabase/server';
import { sendEmail } from '@/lib/email';

type InviteType = 'bench' | 'team';

async function checkAdmin() {
  const { userId } = await auth();

  if (!userId) {
    return { isAdmin: false };
  }

  const supabase = createServerClient();
  let { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('clerk_id', userId)
    .single();

  if (!profile) {
    const result = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('user_id', userId)
      .single();
    profile = result.data;
  }

  return { isAdmin: profile?.is_admin === true };
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { isAdmin } = await checkAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { id: firmId } = await params;
    const body = await request.json().catch(() => ({}));
    const inviteType = (body?.inviteType || 'bench') as InviteType;

    if (!firmId) {
      return NextResponse.json({ error: 'Firm ID is required' }, { status: 400 });
    }

    if (!['bench', 'team'].includes(inviteType)) {
      return NextResponse.json({ error: 'inviteType must be bench or team' }, { status: 400 });
    }

    const supabase = createServerClient();
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://taxproexchange.com';

    const { data: firm, error: firmError } = await supabase
      .from('firms')
      .select('id, name')
      .eq('id', firmId)
      .single();

    if (firmError || !firm) {
      return NextResponse.json({ error: 'Firm not found' }, { status: 404 });
    }

    let sentCount = 0;

    if (inviteType === 'bench') {
      const { data: invites, error: invitesError } = await supabase
        .from('bench_invitations')
        .select(`
          id,
          profile_id,
          profiles!bench_invitations_profile_id_fkey (
            first_name,
            public_email
          ),
          inviter:invited_by_profile_id (
            first_name,
            last_name
          )
        `)
        .eq('firm_id', firmId)
        .eq('status', 'pending');

      if (invitesError) {
        console.error('Error loading bench invitations:', invitesError);
        return NextResponse.json({ error: 'Failed to load bench invitations' }, { status: 500 });
      }

      for (const invite of invites || []) {
        const recipient = invite.profiles as any;
        if (!recipient?.public_email) continue;

        const inviter = invite.inviter as any;
        const inviterName = inviter?.first_name && inviter?.last_name
          ? `${inviter.first_name} ${inviter.last_name}`
          : 'the team';
        const firstName = recipient?.first_name || 'there';

        const subject = `Reminder: ${firm.name} invited you on TaxProExchange`;
        const html = `
          <div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto;">
            <h2 style="color: #0f172a;">You are in high demand, ${firstName}</h2>
            <p style="color: #334155;">${firm.name} is still waiting on your invitation response.</p>
            <p style="color: #334155;">
              ${inviterName} invited you to join their trusted bench on TaxProExchange.
              Please accept or decline so they can plan quickly.
            </p>
            <div style="margin: 24px 0;">
              <a href="${appUrl}/invitations?id=${invite.id}&action=accept" style="background: #059669; color: white; padding: 12px 18px; border-radius: 6px; text-decoration: none; margin-right: 10px; display: inline-block;">Accept</a>
              <a href="${appUrl}/invitations?id=${invite.id}&action=decline" style="background: #64748b; color: white; padding: 12px 18px; border-radius: 6px; text-decoration: none; display: inline-block;">Decline</a>
            </div>
            <p style="font-size: 13px; color: #64748b;">Open all invitations: <a href="${appUrl}/invitations">${appUrl}/invitations</a></p>
          </div>
        `;

        try {
          await sendEmail({
            to: recipient.public_email,
            subject,
            html,
          });
          sentCount += 1;
        } catch (error) {
          console.error(`Failed to send bench reminder for invite ${invite.id}:`, error);
        }
      }
    }

    if (inviteType === 'team') {
      const { data: invites, error: invitesError } = await supabase
        .from('firm_member_invitations')
        .select(`
          id,
          invited_email,
          token,
          role,
          invited_by_profile_id,
          profiles!firm_member_invitations_invited_by_profile_id_fkey (
            first_name,
            last_name
          )
        `)
        .eq('firm_id', firmId)
        .eq('status', 'pending');

      if (invitesError) {
        console.error('Error loading team invitations:', invitesError);
        return NextResponse.json({ error: 'Failed to load team invitations' }, { status: 500 });
      }

      for (const invite of invites || []) {
        if (!invite.invited_email || !invite.token) continue;

        const inviter = (invite as any).profiles;
        const inviterName = inviter?.first_name && inviter?.last_name
          ? `${inviter.first_name} ${inviter.last_name}`
          : 'the team';

        const subject = `Reminder: ${firm.name} invited you to join their team`;
        const html = `
          <div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto;">
            <h2 style="color: #0f172a;">You are in high demand</h2>
            <p style="color: #334155;">${firm.name} is still waiting on your invitation response.</p>
            <p style="color: #334155;">
              ${inviterName} invited you to join as a ${invite.role} on TaxProExchange.
              Please accept or decline soon so they can plan their team.
            </p>
            <div style="margin: 24px 0;">
              <a href="${appUrl}/firm-invite/${invite.token}" style="background: #2563eb; color: white; padding: 12px 18px; border-radius: 6px; text-decoration: none; display: inline-block;">Review Invitation</a>
            </div>
          </div>
        `;

        try {
          await sendEmail({
            to: invite.invited_email,
            subject,
            html,
          });
          sentCount += 1;
        } catch (error) {
          console.error(`Failed to send team reminder for invite ${invite.id}:`, error);
        }
      }
    }

    return NextResponse.json({
      success: true,
      inviteType,
      sentCount,
    });
  } catch (error) {
    console.error('Error sending invitation reminders:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
