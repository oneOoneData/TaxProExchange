import { NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';

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

    // Check if profile exists for this user
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, clerk_user_id')
      .eq('clerk_user_id', userId)
      .maybeSingle();

    // Get all profiles to see what clerk_user_id values exist
    const { data: allProfiles, error: allProfilesError } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, clerk_user_id')
      .limit(5);

    return NextResponse.json({
      success: true,
      currentUser: {
        clerkUserId: userId,
        email: user.emailAddresses[0]?.emailAddress,
        fullName: user.fullName,
        firstName: user.firstName,
        lastName: user.lastName
      },
      profileFound: !!profile,
      profile: profile || null,
      profileError: profileError || null,
      sampleProfiles: allProfiles || [],
      allProfilesError: allProfilesError || null
    });

  } catch (error) {
    console.error('Debug user info error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
