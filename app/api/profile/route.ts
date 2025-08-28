// app/api/profile/route.ts
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseService } from '@/lib/supabaseService';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const clerkId = searchParams.get('clerk_id') ?? null;
  
  if (!clerkId) {
    return NextResponse.json({ error: 'clerk_id is required' }, { status: 400 });
  }

  try {
    const supabase = supabaseService();
    
    // Get basic profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('clerk_id', clerkId)
      .single();

    if (profileError && profileError.code !== 'PGRST116') {
      console.error('Profile fetch error:', profileError);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    if (!profile) {
      return NextResponse.json({});
    }

    // Return basic profile with empty arrays for now
    return NextResponse.json({
      ...profile,
      specializations: [],
      states: [],
      software: [],
      other_software: profile.other_software || []
    });
  } catch (error) {
    console.error('Profile fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { 
      clerk_id, 
      specializations, 
      states, 
      software, 
      other_software,
      ...profileData 
    } = body;

    if (clerk_id !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const supabase = supabaseService();
    
    // Just save the basic profile data for now
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .upsert({
        clerk_id,
        ...profileData,
        other_software: other_software || [],
        onboarding_complete: true,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (profileError) {
      console.error('Profile upsert error:', profileError);
      return NextResponse.json({ error: 'Database error: ' + profileError.message }, { status: 500 });
    }

    console.log('Profile saved successfully:', profile);
    return NextResponse.json({ ok: true, profile });
  } catch (error) {
    console.error('Profile update error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: 'Internal server error: ' + errorMessage }, { status: 500 });
  }
}

export async function POST(_request: Request) {
  return NextResponse.json({ ok: true });
}
