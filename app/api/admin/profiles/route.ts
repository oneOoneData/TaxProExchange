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
    const showDeleted = searchParams.get('showDeleted') === 'true';

    // TODO: Add admin role check here
    // For now, allow access to anyone (we'll secure this later)

    // Build the query - no users table join since we're using Clerk
    let query = supabase
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
        created_at
      `)
      .order('created_at', { ascending: false });

    // Filter by deleted status
    if (showDeleted) {
      query = query.eq('is_deleted', true);
    } else {
      query = query.eq('is_deleted', false);
    }

    const { data: profiles, error } = await query;

    if (error) {
      console.error('Error fetching profiles:', error);
      return NextResponse.json(
        { error: 'Failed to fetch profiles' },
        { status: 500 }
      );
    }

    console.log('🔍 Raw profiles from database:', profiles);

    // Add a placeholder email since we don't have the users table
    const profilesWithEmail = profiles?.map(profile => {
      return {
        ...profile,
        email: 'email@example.com' // Placeholder - you can update this later
      };
    }) || [];

    console.log('🔍 Processed profiles with email:', profilesWithEmail);

    return NextResponse.json({
      profiles: profilesWithEmail
    });

  } catch (error) {
    console.error('Admin profiles error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
