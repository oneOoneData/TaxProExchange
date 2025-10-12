/**
 * Firm Members API
 * GET /api/firm-members - List members of a firm
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createServerClient } from '@/lib/supabase/server';
import { FEATURE_FIRM_WORKSPACES } from '@/lib/flags';

export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const firmId = searchParams.get('firm_id');

    if (!firmId) {
      return NextResponse.json(
        { error: 'Missing firm_id' },
        { status: 400 }
      );
    }

    const supabase = createServerClient();

    // Verify user is a member of this firm
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

    const { data: membership } = await supabase
      .from('firm_members')
      .select('id')
      .eq('firm_id', firmId)
      .eq('profile_id', profile.id)
      .eq('status', 'active')
      .single();

    if (!membership) {
      return NextResponse.json(
        { error: 'Not a member of this firm' },
        { status: 403 }
      );
    }

    // Get all active members
    const { data: members, error } = await supabase
      .from('firm_members')
      .select(`
        id,
        profile_id,
        role,
        status,
        created_at,
        profiles (
          first_name,
          last_name,
          email,
          public_email,
          avatar_url,
          image_url
        )
      `)
      .eq('firm_id', firmId)
      .eq('status', 'active')
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching firm members:', error);
      return NextResponse.json(
        { error: 'Failed to fetch members' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      members: members || [],
    });

  } catch (error: any) {
    console.error('Error in GET /api/firm-members:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

