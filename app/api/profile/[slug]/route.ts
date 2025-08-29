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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    // Check if Supabase is configured
    if (!supabase) {
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 503 }
      );
    }

    const { slug } = await params;

    // Fetch the profile
    const { data: profile, error: profileError } = await supabase
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
        public_email,
        phone,
        website_url,
        linkedin_url,
        accepting_work,
        visibility_state,
        is_listed,
        created_at
      `)
      .eq('slug', slug)
      .eq('visibility_state', 'verified')
      .eq('is_listed', true)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      );
    }

    // Fetch specializations
    const { data: specializations } = await supabase
      .from('profile_specializations')
      .select('specialization_id')
      .eq('profile_id', profile.id);

    // Fetch locations
    const { data: locations } = await supabase
      .from('profile_locations')
      .select('location_id')
      .eq('profile_id', profile.id);

    // Fetch licenses
    const { data: licenses } = await supabase
      .from('licenses')
      .select(`
        license_kind,
        license_number,
        issuing_authority,
        state,
        expires_on,
        status
      `)
      .eq('profile_id', profile.id)
      .eq('status', 'verified');

    const profileWithDetails = {
      ...profile,
      specializations: specializations?.map(s => s.specialization_id) || [],
      states: locations?.map(l => l.location_id) || [],
      verified: profile.visibility_state === 'verified',
      licenses: licenses || []
    };

    return NextResponse.json(profileWithDetails);

  } catch (error) {
    console.error('Profile fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
