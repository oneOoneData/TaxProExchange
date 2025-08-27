import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Extract search parameters
    const query = searchParams.get('q') || '';
    const credentialType = searchParams.get('credential_type');
    const state = searchParams.get('state');
    const specialization = searchParams.get('specialization');
    const acceptingWork = searchParams.get('accepting_work');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    
    // Build the base query
    let supabaseQuery = supabase
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
        accepting_work,
        visibility_state,
        is_listed,
        profile_specializations!inner(specialization_id),
        profile_locations!inner(location_id),
        locations!profile_locations(country, state, city)
      `)
      .eq('visibility_state', 'verified')
      .eq('is_listed', true);
    
    // Text search using full-text search
    if (query) {
      supabaseQuery = supabaseQuery.or(`headline.ilike.%${query}%,bio.ilike.%${query}%,firm_name.ilike.%${query}%`);
    }
    
    // Credential type filter
    if (credentialType) {
      supabaseQuery = supabaseQuery.eq('credential_type', credentialType);
    }
    
    // State filter
    if (state) {
      supabaseQuery = supabaseQuery.eq('locations.state', state);
    }
    
    // Specialization filter
    if (specialization) {
      supabaseQuery = supabaseQuery.eq('profile_specializations.specialization_id', specialization);
    }
    
    // Availability filter
    if (acceptingWork === 'true') {
      supabaseQuery = supabaseQuery.eq('accepting_work', true);
    }
    
    // Pagination
    const startIndex = (page - 1) * limit;
    supabaseQuery = supabaseQuery.range(startIndex, startIndex + limit - 1);
    
    // Execute query
    const { data: profiles, error, count } = await supabaseQuery;
    
    if (error) {
      console.error('Supabase search error:', error);
      throw new Error(`Database error: ${error.message}`);
    }
    
    // Transform the data to match our expected format
    const transformedProfiles = profiles?.map(profile => ({
      id: profile.id,
      slug: profile.slug,
      first_name: profile.first_name,
      last_name: profile.last_name,
      headline: profile.headline,
      bio: profile.bio,
      credential_type: profile.credential_type,
      firm_name: profile.firm_name,
      public_email: profile.public_email,
      accepting_work: profile.accepting_work,
      verified: profile.visibility_state === 'verified',
      specializations: profile.profile_specializations?.map((ps: any) => ps.specialization_id) || [],
      states: profile.locations?.map((loc: any) => loc.state).filter(Boolean) || [],
      avatar_url: null
    })) || [];
    
    // Calculate pagination info
    const total = count || 0;
    const totalPages = Math.ceil(total / limit);
    
    return NextResponse.json({
      profiles: transformedProfiles,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });
    
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
