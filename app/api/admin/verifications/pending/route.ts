import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.warn('Supabase environment variables not configured');
}

const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

export async function GET(request: NextRequest) {
  try {
    // Check if Supabase is configured
    if (!supabase) {
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 503 }
      );
    }

    // TODO: Add admin role check here
    // For now, allow access to anyone (we'll secure this later)

    // Get profiles with pending verification status
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select(`
        id,
        first_name,
        last_name,
        headline,
        bio,
        credential_type,
        firm_name,
        slug,
        created_at
      `)
      .eq('visibility_state', 'pending_verification')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching pending verifications:', error);
      return NextResponse.json(
        { error: 'Failed to fetch pending verifications' },
        { status: 500 }
      );
    }

    // Get licenses for each profile
    const profilesWithLicenses = await Promise.all(
      profiles.map(async (profile) => {
        const { data: licenses } = await supabase
          .from('licenses')
          .select(`
            id,
            license_kind,
            license_number,
            issuing_authority,
            state,
            expires_on
          `)
          .eq('profile_id', profile.id);

        return {
          ...profile,
          email: 'email@example.com', // Placeholder since we don't have users table
          licenses: licenses || []
        };
      })
    );

    return NextResponse.json({
      profiles: profilesWithLicenses
    });

  } catch (error) {
    console.error('Pending verifications error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
