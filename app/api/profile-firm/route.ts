/**
 * Profile Firm Info API
 * 
 * GET /api/profile-firm?profile_id={id} - Get firm info for a profile
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { FEATURE_FIRM_WORKSPACES } from '@/lib/flags';

/**
 * GET /api/profile-firm
 * Get firm information for a specific profile (public endpoint)
 */
export async function GET(request: NextRequest) {
  // Feature gate
  if (!FEATURE_FIRM_WORKSPACES) {
    return NextResponse.json(
      { error: 'Feature not available' },
      { status: 404 }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const profileId = searchParams.get('profile_id');

    if (!profileId) {
      return NextResponse.json(
        { error: 'profile_id parameter required' },
        { status: 400 }
      );
    }

    const supabase = createServerClient();

    // Get firms where this profile is an active member
    const { data, error } = await supabase
      .from('firm_members')
      .select(`
        firm_id,
        role,
        firms (
          id,
          name,
          slug,
          website,
          verified
        )
      `)
      .eq('profile_id', profileId)
      .eq('status', 'active')
      .limit(1)
      .single();

    if (error) {
      // Not found is ok - user might not be part of any firm
      if (error.code === 'PGRST116') {
        return NextResponse.json({
          success: true,
          firm: null,
        });
      }
      
      console.error('Error fetching firm:', error);
      return NextResponse.json(
        { error: 'Failed to fetch firm' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      firm: data?.firms || null,
    });
  } catch (error: any) {
    console.error('Error in GET /api/profile-firm:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

