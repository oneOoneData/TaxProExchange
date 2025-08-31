import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { auth, currentUser } from '@clerk/nextjs/server';

export async function GET() {
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

    // First, delete the auto-generated profile
    const { error: deleteError } = await supabase
      .from('profiles')
      .delete()
      .eq('id', '76527ab7-44b6-4cda-a7ea-d919bad0bdec');

    if (deleteError) {
      console.error('Delete error:', deleteError);
    }

    // Create the real profile with proper data
    const { data: newProfile, error: createError } = await supabase
      .from('profiles')
      .insert({
        clerk_user_id: userId,
        clerk_id: userId,
        first_name: 'Koen',
        last_name: 'Van Duyse',
        headline: 'Koen Van Duyse',
        bio: 'deeeelmeeeeeeeeeeeee',
        credential_type: 'CTEC',
        firm_name: 'dddddddddddddddddd',
        public_email: '101datainc@gmail.com',
        phone: '',
        website_url: '',
        linkedin_url: '',
        accepting_work: true,
        verified: false,
        public_contact: true,
        works_multistate: true,
        works_international: false,
        countries: [],
        specializations: [],
        states: [],
        software: [],
        avatar_url: user.imageUrl,
        image_url: user.imageUrl,
        slug: `koen-van-duyse-${Date.now()}`,
        is_listed: false,
        visibility_state: 'verified',
        onboarding_complete: true,
        other_software: ['AME']
      })
      .select()
      .single();

    if (createError) {
      console.error('Profile creation error:', createError);
      return NextResponse.json({ error: 'Failed to create profile' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true,
      message: 'Real profile restored successfully',
      profile: newProfile
    });

  } catch (error) {
    console.error('Restore profile error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

export async function POST() {
  // Same logic as GET for backward compatibility
  return GET();
}
