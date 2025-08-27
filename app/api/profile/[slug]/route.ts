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

    // Fetch profile with all related data
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
        is_listed,
        profile_specializations!inner(specialization_id),
        profile_locations!inner(location_id),
        locations!profile_locations(country, state, city),
        licenses!inner(license_kind, license_number, issuing_authority, state, expires_on, status)
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
      specializations: profile.profile_specializations?.map((ps: any) => ps.specialization_id) || [],
      states: profile.locations?.map((loc: any) => loc.state).filter(Boolean) || [],
      licenses: profile.licenses?.map((license: any) => ({
        kind: license.license_kind,
        number: license.license_number,
        authority: license.issuing_authority,
        state: license.state,
        expires: license.expires_on,
        status: license.status
      })) || [],
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
