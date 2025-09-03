import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Initialize Supabase client
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

    // Get all profiles without any filters to see what's there
    const { data: allProfiles, error: allError } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (allError) {
      console.error('Error fetching all profiles:', allError);
      return NextResponse.json(
        { error: 'Failed to fetch all profiles', details: allError },
        { status: 500 }
      );
    }

    // Get profiles with the join to users table
    const { data: profilesWithUsers, error: joinError } = await supabase
      .from('profiles')
      .select(`
        id,
        first_name,
        last_name,
        credential_type,
        headline,
        bio,
        firm_name,
        slug,
        visibility_state,
        is_listed,
        is_deleted,
        deleted_at,
        created_at,
        users!inner(email)
      `)
      .order('created_at', { ascending: false });

    if (joinError) {
      console.error('Error fetching profiles with users join:', joinError);
    }

    // Check if users table exists and has data
    const { data: usersData, error: usersError } = await supabase
      .from('users')
      .select('*')
      .limit(5);

    return NextResponse.json({
      total_profiles: allProfiles?.length || 0,
      all_profiles: allProfiles || [],
      profiles_with_users_join: profilesWithUsers || [],
      join_error: joinError || null,
      users_table_exists: !usersError,
      users_data: usersData || [],
      users_error: usersError || null,
      message: 'Debug info for admin profiles page'
    });

  } catch (error) {
    console.error('Debug admin profiles error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
