import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.warn('Supabase environment variables not configured');
}

const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

export async function GET(request: Request) {
  try {
    // Check if Supabase is configured
    if (!supabase) {
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 503 }
      );
    }

    const { searchParams } = new URL(request.url);
    const clerkId = searchParams.get('clerk_id');

    // Get all profiles to see what's in the database
    const { data: allProfiles, error: allError } = await supabase
      .from('profiles')
      .select('id, clerk_id, first_name, last_name, created_at')
      .order('created_at', { ascending: false })
      .limit(10);

    if (allError) {
      console.error('Error fetching all profiles:', allError);
      return NextResponse.json(
        { error: 'Failed to fetch profiles', details: allError },
        { status: 500 }
      );
    }

    // If a specific clerk_id was requested, also check for that
    let specificProfile = null;
    if (clerkId) {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('clerk_id', clerkId)
        .single();
      
      if (!profileError) {
        specificProfile = profile;
      }
    }

    // Check the profiles table structure
    const { data: tableInfo, error: tableError } = await supabase
      .from('profiles')
      .select('*')
      .limit(1);

    // Also check if the clerk_id column exists by looking at the table structure
    let hasClerkIdColumn = false;
    let tableColumns: string[] = [];
    
    if (tableInfo && tableInfo.length > 0) {
      tableColumns = Object.keys(tableInfo[0]);
      hasClerkIdColumn = 'clerk_id' in tableInfo[0];
    }

    // Check for any profiles with the specific clerk_id
    let profilesWithClerkId = [];
    if (clerkId) {
      const { data: clerkProfiles, error: clerkError } = await supabase
        .from('profiles')
        .select('*')
        .eq('clerk_id', clerkId);
      
      if (!clerkError) {
        profilesWithClerkId = clerkProfiles || [];
      }
    }

    return NextResponse.json({
      message: 'Debug info for profiles table',
      total_profiles_found: allProfiles?.length || 0,
      all_profiles: allProfiles || [],
      specific_profile: specificProfile,
      table_structure: tableColumns,
      requested_clerk_id: clerkId,
      has_clerk_id_column: hasClerkIdColumn,
      profiles_with_requested_clerk_id: profilesWithClerkId,
      table_info_sample: tableInfo?.[0] || null,
      debug_note: 'Check if clerk_id column exists and if profiles are being created by webhook'
    });

  } catch (error) {
    console.error('Debug profiles error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error },
      { status: 500 }
    );
  }
}
