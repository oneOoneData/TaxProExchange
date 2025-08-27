import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    const specialization = searchParams.get('specialization') || '';
    const state = searchParams.get('state') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = (page - 1) * limit;

    // Build the base query
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
        created_at
      `)
      .eq('visibility_state', 'verified')
      .eq('is_listed', true);

    // Apply text search
    if (query) {
      supabaseQuery = supabaseQuery.or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%,headline.ilike.%${query}%,bio.ilike.%${query}%`);
    }

    // Apply filters
    if (specialization) {
      supabaseQuery = supabaseQuery.eq('profile_specializations.specialization_id', specialization);
    }

    if (state) {
      supabaseQuery = supabaseQuery.eq('profile_locations.location_id', state);
    }

    // Get total count for pagination
    const { count } = await supabaseQuery.count();

    // Apply pagination
    const { data: profiles, error } = await supabaseQuery
      .range(offset, offset + limit - 1)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Search error:', error);
      return NextResponse.json(
        { error: 'Failed to search profiles' },
        { status: 500 }
      );
    }

    // Fetch specializations and locations for each profile
    const profilesWithDetails = await Promise.all(
      profiles.map(async (profile) => {
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
          locations: locations?.map(l => l.location_id) || []
        };
      })
    );

    return NextResponse.json({
      profiles: profilesWithDetails,
      pagination: {
        page,
        limit,
        total: count,
        totalPages: Math.ceil((count || 0) / limit)
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
