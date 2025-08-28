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
    
    // Get profile with related data
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

    // Get specializations
    const { data: specializations } = await supabase
      .from('profile_specializations')
      .select('specialization_slug')
      .eq('profile_id', profile.id);

    // Get states
    const { data: states } = await supabase
      .from('profile_locations')
      .select('state')
      .eq('profile_id', profile.id);

    // Get software
    const { data: software } = await supabase
      .from('profile_software')
      .select('software_slug')
      .eq('profile_id', profile.id);

    // Combine all data
    const fullProfile = {
      ...profile,
      specializations: specializations?.map(s => s.specialization_slug) || [],
      states: states?.map(s => s.state) || [],
      software: software?.map(s => s.software_slug) || [],
      other_software: profile.other_software || []
    };

    return NextResponse.json(fullProfile);
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
    
    // First, upsert the main profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .upsert({
        clerk_id,
        ...profileData,
        other_software,
        onboarding_complete: true,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (profileError) {
      console.error('Profile upsert error:', profileError);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    // Update specializations
    if (specializations) {
      // Delete existing specializations
      await supabase
        .from('profile_specializations')
        .delete()
        .eq('profile_id', profile.id);

      // Insert new specializations
      if (specializations.length > 0) {
        const specializationData = specializations.map((slug: string) => ({
          profile_id: profile.id,
          specialization_slug: slug
        }));
        
        await supabase
          .from('profile_specializations')
          .insert(specializationData);
      }
    }

    // Update states
    if (states) {
      // Delete existing states
      await supabase
        .from('profile_locations')
        .delete()
        .eq('profile_id', profile.id);

      // Insert new states
      if (states.length > 0) {
        const stateData = states.map((state: string) => ({
          profile_id: profile.id,
          state
        }));
        
        await supabase
          .from('profile_locations')
          .insert(stateData);
      }
    }

    // Update software
    if (software) {
      // Delete existing software
      await supabase
        .from('profile_software')
        .delete()
        .eq('profile_id', profile.id);

      // Insert new software
      if (software.length > 0) {
        const softwareData = software.map((slug: string) => ({
          profile_id: profile.id,
          software_slug: slug
        }));
        
        await supabase
          .from('profile_software')
          .insert(softwareData);
      }
    }

    return NextResponse.json(profile);
  } catch (error) {
    console.error('Profile update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(_request: Request) {
  return NextResponse.json({ ok: true });
}
