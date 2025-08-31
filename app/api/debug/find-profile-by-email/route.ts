import { NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const user = await currentUser();
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const userEmail = user.emailAddresses[0]?.emailAddress;
    if (!userEmail) {
      return NextResponse.json({ error: 'No email found for user' }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: 'Database configuration error' }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Search for profile by email
    const { data: profileByEmail, error: emailError } = await supabase
      .from('profiles')
      .select('*')
      .eq('public_email', userEmail)
      .maybeSingle();

    // Also search for profile by clerk_user_id
    const { data: profileByClerkId, error: clerkError } = await supabase
      .from('profiles')
      .select('*')
      .eq('clerk_user_id', userId)
      .maybeSingle();

    // Search for any profile that might match
    const { data: allMatchingProfiles, error: searchError } = await supabase
      .from('profiles')
      .select('*')
      .or(`public_email.eq.${userEmail},clerk_user_id.eq.${userId}`);

    return NextResponse.json({
      success: true,
      searchCriteria: {
        email: userEmail,
        clerkUserId: userId
      },
      profileByEmail: profileByEmail || null,
      profileByClerkId: profileByClerkId || null,
      allMatchingProfiles: allMatchingProfiles || [],
      errors: {
        emailError: emailError || null,
        clerkError: clerkError || null,
        searchError: searchError || null
      }
    });

  } catch (error) {
    console.error('Profile search error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
