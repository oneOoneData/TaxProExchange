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

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    const credential_type = searchParams.get('credential_type') || '';
    const specialization = searchParams.get('specialization') || '';
    const state = searchParams.get('state') || '';
    const accepting_work = searchParams.get('accepting_work') || '';
    const verified_only = searchParams.get('verified_only') || 'false';
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
        created_at
      `, { count: 'exact' })
      .eq('is_listed', true);

    // Apply verified filter - default to showing only verified profiles for non-admin users
    if (verified_only === 'true') {
      supabaseQuery = supabaseQuery.eq('visibility_state', 'verified');
    } else {
      // For non-admin users, only show verified profiles by default
      // This prevents showing profiles that can't be viewed
      supabaseQuery = supabaseQuery.eq('visibility_state', 'verified');
    }

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

    // Execute the base query first
    const { data: profiles, error, count } = await supabaseQuery
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

    // Filter by specialization if specified
    let filteredProfiles = profiles;
    if (specialization) {
      const { data: profileSpecs } = await supabase
        .from('profile_specializations')
        .select('profile_id')
        .eq('specialization_id', (await supabase
          .from('specializations')
          .select('id')
          .eq('slug', specialization)
          .single()).data?.id);
      
      if (profileSpecs) {
        const profileIds = profileSpecs.map(ps => ps.profile_id);
        filteredProfiles = profiles.filter(p => profileIds.includes(p.id));
      }
    }

    // Filter by state if specified
    if (state) {
      // Get profiles that either work in this specific state OR are multi-state
      const { data: stateProfiles } = await supabase
        .from('profiles')
        .select('id')
        .or(`works_multistate.eq.true,id.in.(${filteredProfiles.map(p => `'${p.id}'`).join(',')})`);
      
      if (stateProfiles) {
        // Filter to only include profiles that are either multi-state or have this specific state
        filteredProfiles = filteredProfiles.filter(p => 
          p.works_multistate || stateProfiles.some(sp => sp.id === p.id)
        );
      }
    }

    // Filter by international if specified
    const international = searchParams.get('international') || '';
    if (international === 'true') {
      filteredProfiles = filteredProfiles.filter(p => p.works_international);
    }

    // Filter by specific country if specified
    const country = searchParams.get('country') || '';
    if (country) {
      filteredProfiles = filteredProfiles.filter(p => 
        p.works_international && p.countries && p.countries.includes(country)
      );
    }

    // Fetch specializations and locations for each profile
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

        return {
          ...profile,
          specializations: specializations?.map(s => s.specialization_id) || [],
          states: locations?.map(l => l.location_id) || [],
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
        total: filteredProfiles.length,
        totalPages: Math.ceil(filteredProfiles.length / limit)
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
