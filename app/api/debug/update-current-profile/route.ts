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

    // Update the existing auto-generated profile with real data
    const { data: updatedProfile, error: updateError } = await supabase
      .from('profiles')
      .update({
        first_name: 'Koen',
        last_name: 'Van Duyse',
        headline: 'Koen Van Duyse',
        bio: 'deeeelmeeeeeeeeeeeee',
        credential_type: 'CTEC',
        firm_name: 'dddddddddddddddddd',
        slug: `koen-van-duyse-${Date.now()}`,
        other_software: ['AME']
      })
      .eq('id', '76527ab7-44b6-4cda-a7ea-d919bad0bdec')
      .select()
      .single();

    if (updateError) {
      console.error('Profile update error:', updateError);
      return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true,
      message: 'Profile updated successfully',
      profile: updatedProfile
    });

  } catch (error) {
    console.error('Update profile error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
