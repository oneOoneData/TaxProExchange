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

    // Get profile by slug
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
        public_email,
        phone,
        website_url,
        linkedin_url,
        accepting_work,
        slug,
        created_at
      `)
      .eq('slug', slug)
      .eq('visibility_state', 'verified')
      .eq('is_listed', true)
      .single();

    if (profileError) {
      if (profileError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Profile not found' },
          { status: 404 }
        );
      }
      throw new Error(`Profile fetch error: ${profileError.message}`);
    }

    // Get specializations
    let specializations: any[] = [];
    try {
      const { data: specData } = await supabase
        .from('profile_specializations')
        .select('specialization_id')
        .eq('profile_id', profile.id);
      specializations = specData || [];
    } catch (error) {
      console.error('Specializations fetch error:', error);
    }

    // Get locations
    let locations: any[] = [];
    try {
      const { data: locData } = await supabase
        .from('profile_locations')
        .select('location_id')
        .eq('profile_id', profile.id);
      locations = locData || [];
    } catch (error) {
      console.error('Locations fetch error:', error);
    }

    // Get licenses
    let licenses: any[] = [];
    try {
      const { data: licenseData } = await supabase
        .from('licenses')
        .select('*')
        .eq('profile_id', profile.id);
      licenses = licenseData || [];
    } catch (error) {
      console.error('Licenses fetch error:', error);
    }

    const transformedProfile = {
      ...profile,
      specializations: specializations.map(s => s.specialization_id),
      locations: locations.map(l => l.location_id),
      licenses,
      verified: true
    };

    return NextResponse.json(transformedProfile);

  } catch (error) {
    console.error('Profile fetch error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
