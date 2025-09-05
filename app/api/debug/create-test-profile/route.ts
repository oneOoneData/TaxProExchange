import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.warn('Supabase environment variables not configured');
}

const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

export async function POST(request: NextRequest) {
  try {
    // Check if Supabase is configured
    if (!supabase) {
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 503 }
      );
    }

    // Get the authenticated user from Clerk
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized - please sign in' },
        { status: 401 }
      );
    }

    // Check if profile already exists
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('clerk_id', userId)
      .single();

    if (existingProfile) {
      return NextResponse.json({
        success: true,
        message: 'Profile already exists',
        profileId: existingProfile.id
      });
    }

    // Create a test profile
    const { data: profile, error } = await supabase
      .from('profiles')
      .insert({
        clerk_id: userId,
        first_name: 'Test',
        last_name: 'User',
        headline: 'Test Profile for Development',
        bio: 'This is a test profile created for development testing',
        credential_type: 'Other',
        firm_name: 'Test Firm',
        public_email: 'test@example.com',
        phone: '',
        website_url: '',
        linkedin_url: '',
        accepting_work: true,
        public_contact: false,
        works_multistate: false,
        works_international: false,
        countries: [],
        specializations: [],
        states: [],
        software: [],
        other_software: [],
        years_experience: null,
        entity_revenue_range: null,
        slug: `test-user-${userId.substring(0, 8)}`,
        tos_version: '1.0',
        tos_accepted_at: new Date().toISOString(),
        privacy_version: '1.0',
        privacy_accepted_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating test profile:', error);
      return NextResponse.json(
        { error: 'Failed to create test profile', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Test profile created successfully',
      profile: {
        id: profile.id,
        clerk_id: profile.clerk_id,
        name: `${profile.first_name} ${profile.last_name}`,
        slug: profile.slug
      }
    });

  } catch (error) {
    console.error('Test profile creation error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
