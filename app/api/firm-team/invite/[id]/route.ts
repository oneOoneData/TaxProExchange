import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createServerClient } from '@/lib/supabase/server';
import { getProfileIdFromClerkId, isActiveFirmMember } from '@/lib/authz';
import { FEATURE_FIRM_WORKSPACES } from '@/lib/flags';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

/**
 * DELETE /api/firm-team/invite/[id]
 * Cancel a pending invitation
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  if (!FEATURE_FIRM_WORKSPACES) {
    return NextResponse.json({ error: 'Feature not available' }, { status: 404 });
  }

  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: invitationId } = await params;

    const profileId = await getProfileIdFromClerkId(userId);
    if (!profileId) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    const supabase = createServerClient();

    // Get invitation and verify permissions
    const { data: invitation, error: fetchError } = await supabase
      .from('bench_invitations')
      .select('firm_id, status')
      .eq('id', invitationId)
      .single();

    if (fetchError || !invitation) {
      return NextResponse.json({ error: 'Invitation not found' }, { status: 404 });
    }

    // Check if user is a member of the firm
    const isMember = await isActiveFirmMember(userId, invitation.firm_id);
    if (!isMember) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    if (invitation.status !== 'pending') {
      return NextResponse.json(
        { error: `Cannot cancel ${invitation.status} invitation` },
        { status: 409 }
      );
    }

    // Update status to cancelled instead of deleting (keeps history)
    const { error: updateError } = await supabase
      .from('bench_invitations')
      .update({ status: 'cancelled' })
      .eq('id', invitationId);

    if (updateError) {
      console.error('Error cancelling invitation:', updateError);
      return NextResponse.json(
        { error: 'Failed to cancel invitation' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Invitation cancelled',
    });
  } catch (error: any) {
    console.error('Error in DELETE /api/firm-team/invite/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}


