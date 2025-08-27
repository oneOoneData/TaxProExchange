import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(request: NextRequest) {
  try {
    // Get session to verify user is authenticated
    const session = await getServerSession();
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      first_name,
      last_name,
      headline,
      bio,
      credential_type,
      firm_name,
      public_email,
      phone,
      website_url,
      linkedin_url,
      accepting_work,
      specializations,
      states
    }: {
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
    } = body;

    // Validate required fields
    if (!first_name || !last_name || !headline || !bio || !credential_type || !public_email) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Generate slug from name
    const slug = `${first_name.toLowerCase()}-${last_name.toLowerCase()}-${credential_type.toLowerCase()}`.replace(/[^a-z0-9-]/g, '');

    // Get user ID from auth.users table using email from session
    let { data: authUser, error: authUserError } = await supabase
      .from('auth.users')
      .select('id')
      .eq('email', session.user.email)
      .single();

    if (authUserError || !authUser) {
      console.error('Auth user lookup error:', authUserError);
      throw new Error(`Auth user lookup error: ${authUserError?.message || 'User not found'}`);
    }

    const userId = authUser.id;

    // Check if profile already exists
    const { data: existingProfile, error: profileCheckError } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (profileCheckError && profileCheckError.code !== 'PGRST116') {
      console.error('Profile check error:', profileCheckError);
      throw new Error(`Profile check error: ${profileCheckError.message}`);
    }

    if (existingProfile) {
      return NextResponse.json(
        { error: 'Profile already exists for this user' },
        { status: 400 }
      );
    }

    // Create profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .insert([{
        user_id: userId,
        first_name,
        last_name,
        headline,
        bio,
        credential_type,
        firm_name,
        public_email,
        phone,
        website_url,
        linkedin_url,
        accepting_work,
        visibility_state: 'pending_verification',
        is_listed: false,
        slug
      }])
      .select('id')
      .single();

    if (profileError) {
      console.error('Profile creation error:', profileError);
      throw new Error(`Profile creation error: ${profileError.message}`);
    }

    // Create profile specializations
    if (specializations && specializations.length > 0) {
      const specializationRecords = specializations.map((specSlug: string) => ({
        profile_id: profile.id,
        specialization_id: specSlug
      }));

      const { error: specError } = await supabase
        .from('profile_specializations')
        .insert(specializationRecords);

      if (specError) {
        console.error('Specialization creation error:', specError);
        // Don't fail the whole request for this
      }
    }

    // Create profile locations
    if (states && states.length > 0) {
      const locationRecords = states.map((state: string) => ({
        profile_id: profile.id,
        location_id: state
      }));

      const { error: locationError } = await supabase
        .from('profile_locations')
        .insert(locationRecords);

      if (locationError) {
        console.error('Location creation error:', locationError);
        // Don't fail the whole request for this
      }
    }

    // Create verification request
    const { error: verificationError } = await supabase
      .from('verification_requests')
      .insert([{
        profile_id: profile.id,
        status: 'pending',
        notes: 'Profile created, awaiting credential verification'
      }]);

    if (verificationError) {
      console.error('Verification request creation error:', verificationError);
      // Don't fail the whole request for this
    }

    return NextResponse.json({
      success: true,
      profile_id: profile.id,
      slug,
      message: 'Profile created successfully'
    });

  } catch (error) {
    console.error('Profile creation error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create profile' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get user ID from auth.users table
    const { data: authUser, error: authUserError } = await supabase
      .from('auth.users')
      .select('id')
      .eq('email', session.user.email)
      .single();

    if (authUserError || !authUser) {
      console.error('Auth user lookup error:', authUserError);
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const userId = authUser.id;

    // Get user's profile using user_id
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
        return NextResponse.json({ profile: null });
      }
      throw new Error(`Profile fetch error: ${error.message}`);
    }

    return NextResponse.json({ profile });

  } catch (error) {
    console.error('Profile fetch error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch profile' },
      { status: 500 }
    );
  }
}
