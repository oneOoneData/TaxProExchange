/**
 * Firm Management API
 * DELETE /api/firms/[id] - Delete a firm (admin only)
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

    const { id: firmId } = await params;
    const supabase = createServerClient();

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

    // Check if user is an admin of this firm
    const { data: membership } = await supabase
      .from('firm_members')
      .select('role')
      .eq('firm_id', firmId)
      .eq('profile_id', profile.id)
      .eq('status', 'active')
      .single();

    if (!membership || membership.role !== 'admin') {
      return NextResponse.json(
        { error: 'Only admins can delete the firm' },
        { status: 403 }
      );
    }

    // Delete the firm (cascade will handle members and bench)
    const { error: deleteError } = await supabase
      .from('firms')
      .delete()
      .eq('id', firmId);

    if (deleteError) {
      console.error('Error deleting firm:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete firm' },
        { status: 500 }
      );
    }

    // TODO: Cancel Stripe subscription if exists
    // For now, admins should cancel via Stripe portal first

    return NextResponse.json({
      success: true,
      message: 'Firm deleted successfully',
    });

  } catch (error: any) {
    console.error('Error in DELETE /api/firms/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

