import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params;

    // First, fetch the basic profile
    const { data: profile, error } = await supabase
      .from('profiles')
      .select(`
        id,
        slug,
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
        visibility_state,
        is_listed
      `)
      .eq('slug', slug)
      .eq('visibility_state', 'verified')
      .eq('is_listed', true)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Profile not found' },
          { status: 404 }
        );
      }
      console.error('Supabase profile error:', error);
      throw new Error(`Database error: ${error.message}`);
    }

    if (!profile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      );
    }

    // Fetch related data separately
    let specializations: any[] = [];
    let locations: any[] = [];
    let licenses: any[] = [];

    try {
      // Fetch specializations
      const { data: specs } = await supabase
        .from('profile_specializations')
        .select(`
          specializations!inner(slug, label)
        `)
        .eq('profile_id', profile.id);

      specializations = specs?.map((s: any) => s.specializations.slug) || [];
    } catch (specError) {
      console.error('Specialization fetch error:', specError);
    }

    try {
      // Fetch locations
      const { data: locs } = await supabase
        .from('profile_locations')
        .select(`
          locations!inner(state, city)
        `)
        .eq('profile_id', profile.id);

      locations = locs?.map((l: any) => l.locations.state).filter(Boolean) || [];
    } catch (locError) {
      console.error('Location fetch error:', locError);
    }

    try {
      // Fetch licenses
      const { data: licData } = await supabase
        .from('licenses')
        .select(`
          license_kind,
          license_number,
          issuing_authority,
          state,
          expires_on,
          status
        `)
        .eq('profile_id', profile.id);

      licenses = licData || [];
    } catch (licenseError) {
      console.error('License fetch error:', licenseError);
    }

    // Transform the data to match our expected format
    const transformedProfile = {
      id: profile.id,
      slug: profile.slug,
      first_name: profile.first_name,
      last_name: profile.last_name,
      headline: profile.headline,
      bio: profile.bio,
      credential_type: profile.credential_type,
      firm_name: profile.firm_name,
      public_email: profile.public_email,
      phone: profile.phone,
      website_url: profile.website_url,
      linkedin_url: profile.linkedin_url,
      accepting_work: profile.accepting_work,
      verified: profile.visibility_state === 'verified',
      specializations,
      states: locations,
      licenses: licenses.map((license: any) => ({
        kind: license.license_kind,
        number: license.license_number,
        authority: license.issuing_authority,
        state: license.state,
        expires: license.expires_on,
        status: license.status
      })),
      avatar_url: null
    };

    return NextResponse.json(transformedProfile);

  } catch (error) {
    console.error('Profile fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
