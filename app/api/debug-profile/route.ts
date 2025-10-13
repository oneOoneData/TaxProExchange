/**
 * Debug Profile API - Temporary debugging endpoint
 * GET /api/debug-profile?id={profile_id}
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const profileId = searchParams.get('id');

    if (!profileId) {
      return NextResponse.json(
        { error: 'profile_id parameter required' },
        { status: 400 }
      );
    }

    const supabase = createServerClient();

    // Get the profile with all relevant search fields
    const { data: profile, error } = await supabase
      .from('profiles')
      .select(`
        id,
        first_name,
        last_name,
        slug,
        credential_type,
        is_listed,
        visibility_state,
        profile_type,
        accepting_work,
        headline,
        bio,
        firm_name,
        created_at
      `)
      .eq('id', profileId)
      .single();

    if (error) {
      return NextResponse.json(
        { error: 'Profile not found', details: error },
        { status: 404 }
      );
    }

    // Test if this profile would pass search filters
    const searchFilters = {
      is_listed: profile.is_listed === true,
      not_firm_admin: profile.profile_type !== 'firm_admin',
      is_verified: profile.visibility_state === 'verified',
      has_credential: !!profile.credential_type,
    };

    const shouldAppearInSearch = 
      searchFilters.is_listed && 
      searchFilters.not_firm_admin;

    return NextResponse.json({
      profile,
      searchFilters,
      shouldAppearInSearch,
      recommendation: shouldAppearInSearch 
        ? 'Profile SHOULD appear in search' 
        : `Profile excluded because: ${
            !searchFilters.is_listed ? 'is_listed is false' :
            !searchFilters.not_firm_admin ? 'profile_type is firm_admin' :
            'unknown reason'
          }`
    });
  } catch (error: any) {
    console.error('Error in GET /api/debug-profile:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
