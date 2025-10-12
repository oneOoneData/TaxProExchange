import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { z } from 'zod';
import { createServerClient } from '@/lib/supabase/server';
import { getProfileIdFromClerkId } from '@/lib/authz';
import { FEATURE_FIRM_WORKSPACES } from '@/lib/flags';

const RespondSchema = z.object({
  action: z.enum(['accept', 'decline']),
  response_note: z.string().optional(),
});

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

/**
 * PATCH /api/firm-team/invite/[id]/respond
 * Professional responds to (accepts/declines) an invitation
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  if (!FEATURE_FIRM_WORKSPACES) {
    return NextResponse.json({ error: 'Feature not available' }, { status: 404 });
  }

  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: invitationId } = await params;
    const body = await request.json();
    const { action, response_note } = RespondSchema.parse(body);

    const profileId = await getProfileIdFromClerkId(userId);
    if (!profileId) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    const supabase = createServerClient();

    // Get invitation and verify it's for this user
    const { data: invitation, error: fetchError } = await supabase
      .from('bench_invitations')
      .select('*')
      .eq('id', invitationId)
      .single();

    if (fetchError || !invitation) {
      return NextResponse.json({ error: 'Invitation not found' }, { status: 404 });
    }

    if (invitation.profile_id !== profileId) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    if (invitation.status !== 'pending') {
      return NextResponse.json(
        { error: `Invitation already ${invitation.status}` },
        { status: 409 }
      );
    }

    // Check if expired
    if (new Date(invitation.expires_at) < new Date()) {
      await supabase
        .from('bench_invitations')
        .update({ status: 'expired' })
        .eq('id', invitationId);
      
      return NextResponse.json(
        { error: 'Invitation has expired' },
        { status: 410 }
      );
    }

    const newStatus = action === 'accept' ? 'accepted' : 'declined';

    // Update invitation status
    const { error: updateError } = await supabase
      .from('bench_invitations')
      .update({
        status: newStatus,
        responded_at: new Date().toISOString(),
        response_note: response_note || null,
      })
      .eq('id', invitationId);

    if (updateError) {
      console.error('Error updating invitation:', updateError);
      return NextResponse.json(
        { error: 'Failed to update invitation' },
        { status: 500 }
      );
    }

    // If accepted, create bench item
    if (action === 'accept') {
      // Check if already in bench (shouldn't happen, but be safe)
      const { data: existingBench } = await supabase
        .from('firm_trusted_bench')
        .select('id')
        .eq('firm_id', invitation.firm_id)
        .eq('trusted_profile_id', invitation.profile_id)
        .single();

      if (!existingBench) {
        // Get min priority for new items
        const { data: minItem } = await supabase
          .from('firm_trusted_bench')
          .select('priority')
          .eq('firm_id', invitation.firm_id)
          .order('priority', { ascending: true })
          .limit(1)
          .single();

        const priority = minItem ? minItem.priority - 1 : 100;

        const { error: benchError } = await supabase
          .from('firm_trusted_bench')
          .insert({
            firm_id: invitation.firm_id,
            trusted_profile_id: invitation.profile_id,
            custom_title: invitation.custom_title_offer || null,
            categories: invitation.categories_suggested || [],
            visibility_public: false, // Default to private, firm can change
            priority,
          });

        if (benchError) {
          console.error('Error adding to bench:', benchError);
          console.error('Full error details:', JSON.stringify(benchError, null, 2));
          return NextResponse.json(
            { error: 'Invitation accepted but failed to add to team', details: benchError.message },
            { status: 500 }
          );
        }
      }
    }

    // TODO: Send notification to firm admin
    // This will be added when we implement email notifications

    return NextResponse.json({
      success: true,
      action,
      message: action === 'accept' 
        ? 'Invitation accepted! You have been added to the team.' 
        : 'Invitation declined.',
    });
  } catch (error: any) {
    console.error('Error in PATCH /api/firm-team/invite/[id]/respond:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

