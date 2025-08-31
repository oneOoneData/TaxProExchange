import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { auth, currentUser } from '@clerk/nextjs/server';

export async function POST() {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const user = await currentUser();
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: 'Database configuration error' }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Check if profile already exists
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('clerk_user_id', userId)
      .maybeSingle();

    if (existingProfile) {
      return NextResponse.json({ 
        message: 'Profile already exists',
        profile: existingProfile
      });
    }

    // Create new profile
    const { data: newProfile, error: createError } = await supabase
      .from('profiles')
      .insert({
        clerk_user_id: userId,
        first_name: user.firstName || 'User',
        last_name: user.lastName || '',
        headline: 'Tax Professional',
        bio: 'Professional tax advisor and consultant.',
        credential_type: 'CPA',
        firm_name: '',
        public_email: user.emailAddresses[0]?.emailAddress || '',
        phone: '',
        website_url: '',
        linkedin_url: '',
        accepting_work: true,
        verified: false,
        public_contact: false,
        works_multistate: false,
        works_international: false,
        countries: [],
        specializations: [],
        states: [],
        software: [],
        avatar_url: user.imageUrl,
        slug: `${user.firstName?.toLowerCase()}-${user.lastName?.toLowerCase()}-${Date.now()}`
      })
      .select()
      .single();

    if (createError) {
      console.error('Profile creation error:', createError);
      return NextResponse.json({ error: 'Failed to create profile' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true,
      message: 'Profile created successfully',
      profile: newProfile
    });

  } catch (error) {
    console.error('Profile creation error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
