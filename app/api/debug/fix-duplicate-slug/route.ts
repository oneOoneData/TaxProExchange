import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: 'Database configuration error' }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Find the profile with the duplicate slug
    const { data: duplicateProfile, error: findError } = await supabase
      .from('profiles')
      .select('*')
      .eq('slug', 'koen-van-duyse')
      .single();

    if (findError || !duplicateProfile) {
      return NextResponse.json({ error: 'Duplicate profile not found' }, { status: 404 });
    }

    // Create a unique slug for this profile
    const newSlug = `koen-van-duyse-${duplicateProfile.id.slice(0, 8)}`;

    // Update the profile with the new unique slug
    const { data: updatedProfile, error: updateError } = await supabase
      .from('profiles')
      .update({
        slug: newSlug,
        updated_at: new Date().toISOString()
      })
      .eq('id', duplicateProfile.id)
      .select()
      .single();

    if (updateError) {
      console.error('Profile update error:', updateError);
      return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true,
      message: 'Duplicate slug fixed successfully',
      oldSlug: 'koen-van-duyse',
      newSlug: newSlug,
      profile: updatedProfile
    });

  } catch (error) {
    console.error('Fix duplicate slug error:', error);
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
