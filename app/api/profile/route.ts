import { NextResponse } from 'next/server';

export async function POST() { 
  return NextResponse.json({ ok: true }); 
}

// Get profile by clerk_id
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const clerkId = searchParams.get('clerk_id');
    
    if (!clerkId) {
      return NextResponse.json({ error: 'clerk_id parameter required' }, { status: 400 });
    }

    const supabase = supabaseService();

    // Get basic profile info
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('clerk_id', clerkId)
      .single();

    if (profileError) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
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
    const profileData = {
      ...profile,
      specializations: specializations?.map(s => s.specialization_slug) || [],
      states: states?.map(s => s.state) || [],
      software: software?.map(s => s.software_slug) || []
    };

    return NextResponse.json(profileData);

  } catch (error) {
    console.error('Profile fetch error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const body = await request.json();
    const supabase = supabaseService();

    // First, get the existing profile to get the profile_id
    const { data: existingProfile, error: fetchError } = await supabase
      .from('profiles')
      .select('id')
      .eq('clerk_id', userId)
      .single();

    if (fetchError) {
      console.error('Profile fetch error:', fetchError);
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // Update basic profile info
    const { data: profile, error } = await supabase
      .from('profiles')
      .update({
        first_name: body.first_name,
        last_name: body.last_name,
        headline: body.headline,
        bio: body.bio,
        credential_type: body.credential_type,
        firm_name: body.firm_name,
        public_email: body.public_email,
        phone: body.phone,
        website_url: body.website_url,
        linkedin_url: body.linkedin_url,
        accepting_work: body.accepting_work,
        other_software: body.other_software || [],
        updated_at: new Date().toISOString()
      })
      .eq('clerk_id', userId)
      .select()
      .single();

    if (error) {
      console.error('Profile update error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Update specializations
    if (body.specializations) {
      // Delete existing specializations
      await supabase
        .from('profile_specializations')
        .delete()
        .eq('profile_id', existingProfile.id);

      // Insert new specializations if any
      if (body.specializations.length > 0) {
        const specializationData = body.specializations.map((specSlug: string) => ({
          profile_id: existingProfile.id,
          specialization_slug: specSlug
        }));

        const { error: specError } = await supabase
          .from('profile_specializations')
          .insert(specializationData);

        if (specError) {
          console.error('Specialization update error:', specError);
        }
      }
    }

    // Update states
    if (body.states) {
      // Delete existing locations
      await supabase
        .from('profile_locations')
        .delete()
        .eq('profile_id', existingProfile.id);

      // Insert new locations if any
      if (body.states.length > 0) {
        const locationData = body.states.map((state: string) => ({
          profile_id: existingProfile.id,
          state: state
        }));

        const { error: locError } = await supabase
          .from('profile_locations')
          .insert(locationData);

        if (locError) {
          console.error('Location update error:', locError);
        }
      }
    }

    // Update software
    if (body.software) {
      // Delete existing software
      await supabase
        .from('profile_software')
        .delete()
        .eq('profile_id', existingProfile.id);

      // Insert new software if any
      if (body.software.length > 0) {
        const softwareData = body.software.map((softwareSlug: string) => ({
          profile_id: existingProfile.id,
          software_slug: softwareSlug
        }));

        const { error: swError } = await supabase
          .from('profile_software')
          .insert(softwareData);

        if (swError) {
          console.error('Software update error:', swError);
        }
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Profile updated successfully',
      profile: profile
    });
  } catch (error) {
    console.error('Profile update error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
