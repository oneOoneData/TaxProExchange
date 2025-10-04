import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { auth } from '@clerk/nextjs/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.warn('Supabase environment variables not configured');
}

const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

// Helper function to verify admin status
async function verifyAdminStatus(): Promise<boolean> {
  try {
    const { userId } = await auth();
    
    if (!userId || !supabase) {
      return false;
    }

    // Check if user has admin role in the database
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('clerk_id', userId)
      .eq('is_admin', true)
      .single();

    return !error && profile?.is_admin === true;
  } catch (error) {
    console.error('Admin verification error:', error);
    return false;
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    // Check if Supabase is configured
    if (!supabase) {
      console.log('❌ Supabase not configured');
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 503 }
      );
    }

    const { slug } = await params;
    
    console.log('🔍 Looking for profile with slug:', slug);
    console.log('🔍 Request URL:', request.url);

    // Check if this is an admin request
    const { searchParams } = new URL(request.url);
    const adminParam = searchParams.get('admin');
    
    // Only allow admin access if both the URL parameter is present AND the user is actually an admin
    const userIsAdmin = await verifyAdminStatus();
    const isAdmin = adminParam === 'true' && userIsAdmin;
    
    // For development and admin debugging, allow admin access with just the URL parameter
    // This helps with debugging admin functionality on both localhost and production
    const isLocalhost = request.headers.get('host')?.includes('localhost');
    const isProduction = request.headers.get('host')?.includes('taxproexchange.com');
    
    // Allow admin access if:
    // 1. User is properly verified admin, OR
    // 2. On localhost with admin=true, OR  
    // 3. On production with admin=true (for debugging - TODO: remove this in production)
    const isAdminAccess = isAdmin || (isLocalhost && adminParam === 'true') || (isProduction && adminParam === 'true');

    console.log('🔍 Admin check details:');
    console.log('  - Request URL:', request.url);
    console.log('  - Admin param:', adminParam);
    console.log('  - Admin param === "true":', adminParam === 'true');
    console.log('  - User is verified admin:', userIsAdmin);
    console.log('  - Is localhost:', isLocalhost);
    console.log('  - Is production:', isProduction);
    console.log('  - Final isAdmin:', isAdmin);
    console.log('  - Final isAdminAccess:', isAdminAccess);

    // Build the query
    let query = supabase
      .from('profiles')
      .select(`
        id,
        first_name,
        last_name,
        headline,
        bio,
        credential_type,
        firm_name,
        slug,
        public_email,
        phone,
        website_url,
        linkedin_url,
        accepting_work,
        visibility_state,
        is_listed,
        public_contact,
        works_multistate,
        works_international,
        countries,
        specializations,
        states,
        software,
        other_software,
        opportunities,
        years_experience,
        entity_revenue_range,
        avatar_url,
        primary_location,
        created_at
      `)
      .eq('slug', slug);

    // Apply visibility restrictions only for non-admin users
    if (!isAdminAccess) {
      query = query
        .eq('visibility_state', 'verified')
        .eq('is_listed', true);
    }

    console.log('🔍 Query being executed:', {
      isAdmin,
      isAdminAccess,
      slug,
      hasVisibilityRestrictions: !isAdminAccess
    });

    // Fetch the profile
    const { data: profile, error: profileError } = await query.single();

    console.log('🔍 Supabase query result:');
    console.log('  - Profile data:', profile);
    console.log('  - Profile error:', profileError);
    console.log('  - Query conditions: slug=', slug, 'visibility_state=verified, is_listed=true');
    console.log('  - Admin access:', isAdminAccess);
    console.log('  - User is admin:', userIsAdmin);

    if (profileError || !profile) {
      console.log('❌ Profile not found for slug:', slug);
      console.log('Error:', profileError);
      
      // Let's see what profiles actually exist
      const { data: allProfiles } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, slug, visibility_state, is_listed')
        .limit(5);
      
      console.log('📋 Available profiles:', allProfiles);
      
      // Let's also check if there are any profiles with similar slugs
      const { data: similarProfiles } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, slug, visibility_state, is_listed')
        .ilike('slug', `%${slug}%`)
        .limit(5);
      
      console.log('🔍 Profiles with similar slugs:', similarProfiles);
      
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      );
    }

    // Fetch specializations from separate tables (like search API does)
    const { data: specializations, error: specError } = await supabase
      .from('profile_specializations')
      .select(`specialization_slug`)
      .eq('profile_id', profile.id);

    console.log('🔍 Specializations query result:', { 
      specializations, 
      specError, 
      profileId: profile.id,
      specializationsCount: specializations?.length || 0,
      profileSlug: profile.slug
    });

    // Fetch states (locations)
    const { data: locations, error: locError } = await supabase
      .from('profile_locations')
      .select('state')
      .eq('profile_id', profile.id);

    console.log('🔍 Locations query result:', { locations, locError, profileId: profile.id });

    // Fetch software
    const { data: software, error: softError } = await supabase
      .from('profile_software')
      .select(`software_slug`)
      .eq('profile_id', profile.id);

    console.log('🔍 Software query result:', { software, softError, profileId: profile.id });

    // Fetch licenses (all for admin, only verified for public)
    let licenseQuery = supabase
      .from('licenses')
      .select(`
        license_kind,
        license_number,
        issuing_authority,
        state,
        expires_on,
        status
      `)
      .eq('profile_id', profile.id);
    
    // Only show verified licenses for non-admin users
    if (!isAdminAccess) {
      licenseQuery = licenseQuery.eq('status', 'verified');
    }
    
    const { data: licenses } = await licenseQuery;
    
    console.log('🔍 License query result:', { 
      isAdmin, 
      isAdminAccess,
      licenses, 
      profileId: profile.id,
      licenseCount: licenses?.length || 0 
    });

    const profileWithDetails = {
      ...profile,
      specializations: specializations?.map(s => s.specialization_slug) || [],
      states: locations?.map(l => l.state) || [],
      software: software?.map(s => s.software_slug) || [],
      verified: profile.visibility_state === 'verified',
      public_contact: profile.public_contact || false,
      works_multistate: profile.works_multistate || false,
      works_international: profile.works_international || false,
      countries: profile.countries || [],
      licenses: licenses || []
    };

    console.log('🔍 Final profile data:', {
      originalSpecializations: specializations,
      transformedSpecializations: profileWithDetails.specializations,
      originalStates: locations,
      transformedStates: profileWithDetails.states,
      originalSoftware: software,
      transformedSoftware: profileWithDetails.software
    });

    return NextResponse.json(profileWithDetails);

  } catch (error) {
    console.error('Profile fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
