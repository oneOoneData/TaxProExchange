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
        clerk_id: userId,
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

// Safe no-op to avoid 500s if any stale client code calls this
export async function GET() {
  return NextResponse.json({ ok: true });
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
