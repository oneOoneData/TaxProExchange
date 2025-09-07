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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!supabase) {
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 503 }
      );
    }

    const { id: profileId } = await params;

    // Get profile data
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, user_id, first_name, slug, notified_verified_listed_at, visibility_state, is_listed')
      .eq('id', profileId)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'Profile not found', details: profileError },
        { status: 404 }
      );
    }

    // Get user email
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('email')
      .eq('id', profile.user_id)
      .single();

    // Check if email should be sent
    const shouldSendEmail = !profile.notified_verified_listed_at && profile.slug;

    return NextResponse.json({
      success: true,
      profile: {
        id: profile.id,
        user_id: profile.user_id,
        first_name: profile.first_name,
        slug: profile.slug,
        notified_verified_listed_at: profile.notified_verified_listed_at,
        visibility_state: profile.visibility_state,
        is_listed: profile.is_listed
      },
      user: {
        email: userData?.email || null,
        error: userError?.message || null
      },
      emailCheck: {
        shouldSendEmail,
        reason: !profile.slug ? 'No slug' : 
                profile.notified_verified_listed_at ? 'Already notified' : 
                'Should send email'
      }
    });

  } catch (error) {
    console.error('Profile check error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
