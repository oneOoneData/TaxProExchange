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
    
    // Build the base query - start with just profiles
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
        is_listed
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
    
    // If we have profiles, fetch their related data separately
    let transformedProfiles: any[] = [];
    
    if (profiles && profiles.length > 0) {
      // Fetch specializations for all profiles
      const profileIds = profiles.map(p => p.id);
      
      const { data: specializations, error: specError } = await supabase
        .from('profile_specializations')
        .select(`
          profile_id,
          specializations!inner(slug, label)
        `)
        .in('profile_id', profileIds);
      
      if (specError) {
        console.error('Specialization fetch error:', specError);
      }
      
      // Fetch locations for all profiles
      const { data: locations, error: locError } = await supabase
        .from('profile_locations')
        .select(`
          profile_id,
          locations!inner(state, city)
        `)
        .in('profile_id', profileIds);
      
      if (locError) {
        console.error('Location fetch error:', locError);
      }
      
      // Group specializations and locations by profile_id
      const specsByProfile = specializations?.reduce((acc: any, spec: any) => {
        if (!acc[spec.profile_id]) acc[spec.profile_id] = [];
        acc[spec.profile_id].push(spec.specializations.slug);
        return acc;
      }, {}) || {};
      
      const statesByProfile = locations?.reduce((acc: any, loc: any) => {
        if (!acc[loc.profile_id]) acc[loc.profile_id] = [];
        if (loc.locations.state && !acc[loc.profile_id].includes(loc.locations.state)) {
          acc[loc.profile_id].push(loc.locations.state);
        }
        return acc;
      }, {}) || {};
      
      // Transform profiles with their related data
      transformedProfiles = profiles.map(profile => ({
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
        specializations: specsByProfile[profile.id] || [],
        states: statesByProfile[profile.id] || [],
        avatar_url: null
      }));
      
      // Apply state filter after fetching locations
      if (state) {
        transformedProfiles = transformedProfiles.filter(profile => 
          profile.states.includes(state)
        );
      }
      
      // Apply specialization filter after fetching specializations
      if (specialization) {
        transformedProfiles = transformedProfiles.filter(profile => 
          profile.specializations.includes(specialization)
        );
      }
    }
    
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
