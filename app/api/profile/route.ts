import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseService } from '@/lib/supabaseService';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const body: {
      first_name: string;
      last_name: string;
      headline: string;
      bio: string;
      credential_type: string;
      firm_name: string;
      public_email: string;
      phone: string;
      website_url: string;
      linkedin_url: string;
      accepting_work: boolean;
      specializations: string[];
      states: string[];
    } = await request.json();

    const supabase = supabaseService();

    // Create profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .insert({
        user_id: userId,
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
        visibility_state: 'pending',
        is_listed: false,
        slug: `${body.first_name.toLowerCase()}-${body.last_name.toLowerCase()}-${Date.now()}`
      })
      .select()
      .single();

    if (profileError) {
      console.error('Profile creation error:', profileError);
      return NextResponse.json({ error: 'Failed to create profile' }, { status: 500 });
    }

    // Create profile specializations
    if (body.specializations.length > 0) {
      const specializationData = body.specializations.map((specSlug: string) => ({
        profile_id: profile.id,
        specialization_id: specSlug
      }));

      const { error: specError } = await supabase
        .from('profile_specializations')
        .insert(specializationData);

      if (specError) {
        console.error('Specialization creation error:', specError);
        // Continue anyway, don't fail the whole request
      }
    }

    // Create profile locations
    if (body.states.length > 0) {
      const locationData = body.states.map((state: string) => ({
        profile_id: profile.id,
        location_id: state
      }));

      const { error: locError } = await supabase
        .from('profile_locations')
        .insert(locationData);

      if (locError) {
        console.error('Location creation error:', locError);
        // Continue anyway, don't fail the whole request
      }
    }

    // Create verification request
    const { error: verificationError } = await supabase
      .from('verification_requests')
      .insert({
        profile_id: profile.id,
        status: 'pending',
        notes: 'Profile created, awaiting credential verification'
      });

    if (verificationError) {
      console.error('Verification request creation error:', verificationError);
      // Continue anyway, don't fail the whole request
    }

    return NextResponse.json({ 
      success: true, 
      profile_id: profile.id,
      message: 'Profile created successfully' 
    });

  } catch (error) {
    console.error('Profile creation error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const supabase = supabaseService();
    
    const { data: profile, error } = await supabase
      .from('profiles')
      .select(`
        *,
        profile_specializations(specialization_id),
        profile_locations(location_id)
      `)
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
      }
      throw error;
    }

    return NextResponse.json({ profile });

  } catch (error) {
    console.error('Profile fetch error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
