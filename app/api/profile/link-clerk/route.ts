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

    // Find the profile by email
    const { data: profile, error: findError } = await supabase
      .from('profiles')
      .select('*')
      .eq('public_email', userEmail)
      .single();

    if (findError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // Update the profile to link it to current Clerk user ID
    const { data: updatedProfile, error: updateError } = await supabase
      .from('profiles')
      .update({
        clerk_user_id: userId,
        clerk_id: userId, // Also update the clerk_id field
        image_url: user.imageUrl, // Update with current Clerk image
        updated_at: new Date().toISOString()
      })
      .eq('id', profile.id)
      .select()
      .single();

    if (updateError) {
      console.error('Profile update error:', updateError);
      return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true,
      message: 'Profile linked to Clerk user successfully',
      profile: updatedProfile
    });

  } catch (error) {
    console.error('Profile linking error:', error);
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
