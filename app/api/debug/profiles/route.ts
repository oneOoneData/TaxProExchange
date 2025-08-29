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

    // Get all profiles with their current status
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select(`
        id,
        first_name,
        last_name,
        slug,
        visibility_state,
        is_listed,
        credential_type,
        created_at
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Debug query error:', error);
      return NextResponse.json(
        { error: 'Failed to query profiles' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      total_profiles: profiles?.length || 0,
      profiles: profiles || [],
      search_criteria: {
        visibility_state: 'verified',
        is_listed: true
      },
      message: 'Check the profiles array to see current status values'
    });

  } catch (error) {
    console.error('Debug error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
