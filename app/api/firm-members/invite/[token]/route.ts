/**
 * Firm Member Invitation Response API
 * POST /api/firm-members/invite/[token] - Accept or decline invitation
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createServerClient } from '@/lib/supabase/server';
import { FEATURE_FIRM_WORKSPACES } from '@/lib/flags';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  if (!FEATURE_FIRM_WORKSPACES) {
    return NextResponse.json(
      { error: 'Feature not available' },
      { status: 404 }
    );
  }

  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { action } = body; // 'accept' or 'decline'

    if (!['accept', 'decline'].includes(action)) {
      return NextResponse.json(
        { error: 'Action must be accept or decline' },
        { status: 400 }
      );
    }

    const { token } = await params;
    const supabase = createServerClient();

    // Get user's profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, email, public_email')
      .eq('clerk_user_id', userId)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      );
    }

    // Get invitation
    const { data: invitation, error: inviteError } = await supabase
      .from('firm_member_invitations')
      .select('*')
      .eq('token', token)
      .single();

    if (inviteError || !invitation) {
      return NextResponse.json(
        { error: 'Invitation not found' },
        { status: 404 }
      );
    }

    // Check if invitation is still valid
    if (invitation.status !== 'pending') {
      return NextResponse.json(
        { error: `Invitation already ${invitation.status}` },
        { status: 400 }
      );
    }

    if (new Date(invitation.expires_at) < new Date()) {
      // Mark as expired
      await supabase
        .from('firm_member_invitations')
        .update({ status: 'expired' })
        .eq('id', invitation.id);

      return NextResponse.json(
        { error: 'Invitation has expired' },
        { status: 400 }
      );
    }

    // Check if invitation is for this user
    const userEmail = profile.email || profile.public_email;
    if (invitation.invited_email !== userEmail?.toLowerCase()) {
      return NextResponse.json(
        { error: 'This invitation was sent to a different email address' },
        { status: 403 }
      );
    }

    if (action === 'decline') {
      // Update invitation status
      await supabase
        .from('firm_member_invitations')
        .update({ 
          status: 'declined',
          accepted_at: new Date().toISOString(),
        })
        .eq('id', invitation.id);

      return NextResponse.json({
        success: true,
        message: 'Invitation declined',
      });
    }

    // Accept invitation
    // Check if user is already a member
    const { data: existingMember } = await supabase
      .from('firm_members')
      .select('id, status')
      .eq('firm_id', invitation.firm_id)
      .eq('profile_id', profile.id)
      .single();

    if (existingMember) {
      if (existingMember.status === 'active') {
        return NextResponse.json(
          { error: 'You are already a member of this firm' },
          { status: 400 }
        );
      }

      // Reactivate membership if previously removed
      await supabase
        .from('firm_members')
        .update({ 
          status: 'active',
          role: invitation.role,
        })
        .eq('id', existingMember.id);
    } else {
      // Create new membership
      await supabase
        .from('firm_members')
        .insert({
          firm_id: invitation.firm_id,
          profile_id: profile.id,
          role: invitation.role,
          status: 'active',
        });
    }

    // Update invitation
    await supabase
      .from('firm_member_invitations')
      .update({ 
        status: 'accepted',
        accepted_at: new Date().toISOString(),
        invited_profile_id: profile.id,
      })
      .eq('id', invitation.id);

    // Get firm details for response
    const { data: firm } = await supabase
      .from('firms')
      .select('id, name, slug')
      .eq('id', invitation.firm_id)
      .single();

    return NextResponse.json({
      success: true,
      message: 'Invitation accepted',
      firm: firm,
    });

  } catch (error: any) {
    console.error('Error in POST /api/firm-members/invite/[token]:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

