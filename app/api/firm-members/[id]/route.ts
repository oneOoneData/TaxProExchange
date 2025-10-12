/**
 * Firm Member Management API
 * DELETE /api/firm-members/[id] - Remove a member from the firm
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createServerClient } from '@/lib/supabase/server';
import { FEATURE_FIRM_WORKSPACES } from '@/lib/flags';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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

    const { id: memberId } = await params;
    const supabase = createServerClient();

    // Get the member to check firm_id and role
    const { data: memberToRemove, error: fetchError } = await supabase
      .from('firm_members')
      .select('firm_id, role, profile_id')
      .eq('id', memberId)
      .single();

    if (fetchError || !memberToRemove) {
      return NextResponse.json(
        { error: 'Member not found' },
        { status: 404 }
      );
    }

    // Get requesting user's profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('clerk_user_id', userId)
      .single();

    if (!profile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      );
    }

    // Check if requesting user is an admin of this firm
    const { data: requestingMember } = await supabase
      .from('firm_members')
      .select('role')
      .eq('firm_id', memberToRemove.firm_id)
      .eq('profile_id', profile.id)
      .eq('status', 'active')
      .single();

    if (!requestingMember || requestingMember.role !== 'admin') {
      return NextResponse.json(
        { error: 'Only admins can remove members' },
        { status: 403 }
      );
    }

    // Don't allow removing admins
    if (memberToRemove.role === 'admin') {
      return NextResponse.json(
        { error: 'Cannot remove admin members' },
        { status: 400 }
      );
    }

    // Remove the member (change status to 'removed')
    const { error: updateError } = await supabase
      .from('firm_members')
      .update({ status: 'removed' })
      .eq('id', memberId);

    if (updateError) {
      console.error('Error removing member:', updateError);
      return NextResponse.json(
        { error: 'Failed to remove member' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Member removed successfully',
    });

  } catch (error: any) {
    console.error('Error in DELETE /api/firm-members/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

