import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Initialize Supabase client with service role key to bypass RLS
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

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

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    const credential_type = searchParams.get('credential_type') || '';
    const specialization = searchParams.get('specialization') || '';
    const state = searchParams.get('state') || '';
    const accepting_work = searchParams.get('accepting_work') || '';
    const verified_only = searchParams.get('verified_only') || 'false';
    const years_experience = searchParams.get('years_experience') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = (page - 1) * limit;

    // Build the base query with proper joins
    let supabaseQuery = supabase
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
        accepting_work,
        visibility_state,
        is_listed,
        works_multistate,
        works_international,
        countries,
        years_experience,
        created_at
      `, { count: 'exact' })
      .eq('is_listed', true);

    // Apply verified filter based on user preference
    if (verified_only === 'true') {
      supabaseQuery = supabaseQuery.eq('visibility_state', 'verified');
    }
    // When verified_only is false, show all profiles (both verified and unverified)
    // Users can still only view verified profiles due to profile API restrictions

    // Apply text search
    if (query) {
      supabaseQuery = supabaseQuery.or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%,headline.ilike.%${query}%,bio.ilike.%${query}%,firm_name.ilike.%${query}%`);
    }

    // Apply credential type filter
    if (credential_type) {
      supabaseQuery = supabaseQuery.eq('credential_type', credential_type);
    }

    // Apply accepting work filter
    if (accepting_work === 'true') {
      supabaseQuery = supabaseQuery.eq('accepting_work', true);
    }

    // Apply years of experience filter
    if (years_experience) {
      supabaseQuery = supabaseQuery.eq('years_experience', years_experience);
    }

    // Apply specialization filter if specified
    if (specialization) {
      const { data: specData } = await supabase
        .from('specializations')
        .select('id')
        .eq('slug', specialization)
        .single();
      
      if (specData) {
        const { data: profileSpecs } = await supabase
          .from('profile_specializations')
          .select('profile_id')
          .eq('specialization_id', specData.id);
        
        if (profileSpecs && profileSpecs.length > 0) {
          const profileIds = profileSpecs.map(ps => ps.profile_id);
          supabaseQuery = supabaseQuery.in('id', profileIds);
        } else {
          // No profiles with this specialization, return empty result
          return NextResponse.json({
            profiles: [],
            pagination: {
              page,
              limit,
              total: 0,
              totalPages: 0
            }
          });
        }
      }
    }

    // Apply state filter if specified
    if (state) {
      // This is complex because we need to check both direct state matches and multi-state profiles
      // For now, we'll get all profiles and filter in memory for state
      // TODO: Optimize this with a proper join
    }

    // Apply international filter if specified
    const international = searchParams.get('international') || '';
    if (international === 'true') {
      supabaseQuery = supabaseQuery.eq('works_international', true);
    }

    // Apply country filter if specified
    const country = searchParams.get('country') || '';
    if (country) {
      supabaseQuery = supabaseQuery.eq('works_international', true);
      // Note: Country filtering within the countries array would need a more complex query
    }

    // Get total count first
    const { count: totalCount } = await supabaseQuery;

    // Execute the query with pagination
    const { data: profiles, error } = await supabaseQuery
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Search error:', error);
      return NextResponse.json(
        { error: 'Failed to search profiles' },
        { status: 500 }
      );
    }

    console.log('🔍 Search API - Raw profiles found:', profiles?.length || 0);
    if (profiles && profiles.length > 0) {
      console.log('🔍 First profile sample:', {
        id: profiles[0].id,
        name: `${profiles[0].first_name} ${profiles[0].last_name}`,
        slug: profiles[0].slug,
        visibility_state: profiles[0].visibility_state,
        is_listed: profiles[0].is_listed
      });
    }

    // Apply remaining filters that can't be done in SQL
    let filteredProfiles = profiles || [];

    // Filter by state if specified (complex filtering)
    if (state) {
      // Get profiles that work in this specific state
      const { data: stateProfiles } = await supabase
        .from('profile_locations')
        .select('profile_id')
        .eq('location_id', state);
      
      if (stateProfiles) {
        const stateProfileIds = stateProfiles.map(sp => sp.profile_id);
        filteredProfiles = filteredProfiles.filter(p => 
          p.works_multistate || stateProfileIds.includes(p.id)
        );
      } else {
        // No profiles in this state, only show multi-state profiles
        filteredProfiles = filteredProfiles.filter(p => p.works_multistate);
      }
    }

    // Filter by specific country if specified
    if (country) {
      filteredProfiles = filteredProfiles.filter(p => 
        p.works_international && p.countries && p.countries.includes(country)
      );
    }

    // Fetch specializations, locations, and licenses for each profile
    const profilesWithDetails = await Promise.all(
      filteredProfiles.map(async (profile) => {
        // Get specializations
        const { data: specializations } = await supabase
          .from('profile_specializations')
          .select('specialization_id')
          .eq('profile_id', profile.id);

        // Get locations
        const { data: locations } = await supabase
          .from('profile_locations')
          .select('location_id')
          .eq('profile_id', profile.id);

        // Get licenses using the public view (never includes license_number)
        const { data: licenses } = await supabase
          .from('licenses_public_view')
          .select('*')
          .eq('profile_id', profile.id);

        return {
          ...profile,
          specializations: specializations?.map(s => s.specialization_id) || [],
          states: locations?.map(l => l.location_id) || [],
          licenses: licenses || [],
          verified: profile.visibility_state === 'verified',
          works_multistate: profile.works_multistate || false,
          works_international: profile.works_international || false,
          countries: profile.countries || []
        };
      })
    );

    return NextResponse.json({
      profiles: profilesWithDetails,
      pagination: {
        page,
        limit,
        total: totalCount || 0,
        totalPages: Math.ceil((totalCount || 0) / limit)
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
