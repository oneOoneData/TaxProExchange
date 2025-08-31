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

    // Find all profiles with similar names
    const { data: koenProfiles, error: koenError } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, slug, public_email, clerk_user_id, created_at')
      .or('first_name.eq.Koen,last_name.eq.Van Duyse')
      .order('created_at', { ascending: false });

    // Find all profiles to check for slug duplicates
    const { data: allProfiles, error: allError } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, slug, public_email, created_at')
      .order('created_at', { ascending: false });

    // Group by slug to find duplicates
    const slugGroups: Record<string, any[]> = {};
    allProfiles?.forEach(profile => {
      if (!slugGroups[profile.slug]) {
        slugGroups[profile.slug] = [];
      }
      slugGroups[profile.slug].push(profile);
    });

    const duplicateSlugs = Object.entries(slugGroups)
      .filter(([slug, profiles]) => profiles.length > 1)
      .map(([slug, profiles]) => ({ slug, profiles }));

    return NextResponse.json({
      success: true,
      koenProfiles: koenProfiles || [],
      koenError: koenError || null,
      duplicateSlugs,
      allProfiles: allProfiles || [],
      allError: allError || null
    });

  } catch (error) {
    console.error('Duplicate profiles check error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
