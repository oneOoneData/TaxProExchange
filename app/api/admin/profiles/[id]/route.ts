import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.warn('Supabase environment variables not configured');
}

const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

// Function to get user email from Clerk
async function getUserEmailFromClerk(clerkId: string): Promise<string | null> {
  try {
    const response = await fetch(`https://api.clerk.com/v1/users/${clerkId}`, {
      headers: {
        'Authorization': `Bearer ${process.env.CLERK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.warn(`Failed to fetch user ${clerkId} from Clerk:`, response.status);
      return null;
    }

    const userData = await response.json();
    
    // Extract email from the user data
    if (userData.primary_email_address_id && userData.email_addresses) {
      const primaryEmail = userData.email_addresses.find((e: any) => e.id === userData.primary_email_address_id);
      if (primaryEmail) {
        return primaryEmail.email_address;
      }
    }
    
    // Fallback to first email address
    if (userData.email_addresses && userData.email_addresses.length > 0) {
      return userData.email_addresses[0].email_address;
    }

    return null;
  } catch (error) {
    console.error(`Error fetching user ${clerkId} from Clerk:`, error);
    return null;
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check if Supabase is configured
    if (!supabase) {
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 503 }
      );
    }

    const { id: profileId } = await params;

    // TODO: Add admin role check here
    // For now, allow access to anyone (we'll secure this later)

    // Fetch the profile - include clerk_id to fetch email
    const { data: profile, error } = await supabase
      .from('profiles')
      .select(`
        id,
        first_name,
        last_name,
        credential_type,
        headline,
        bio,
        firm_name,
        slug,
        visibility_state,
        is_listed,
        is_deleted,
        deleted_at,
        created_at,
        updated_at,
        clerk_id,
        public_email,
        phone,
        website_url,
        linkedin_url,
        accepting_work,
        public_contact,
        works_multistate,
        works_international,
        countries,
        specializations,
        states,
        software,
        other_software,
        years_experience,
        entity_revenue_range,
        primary_location,
        ptin
      `)
      .eq('id', profileId)
      .single();

    if (error || !profile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      );
    }

    // Fetch real email from Clerk
    let email = 'No email available';
    if (profile.clerk_id) {
      const realEmail = await getUserEmailFromClerk(profile.clerk_id);
      if (realEmail) {
        email = realEmail;
      }
    }

    // Fetch licenses (including license numbers for admin)
    const { data: licenses } = await supabase
      .from('licenses')
      .select('*')
      .eq('profile_id', profileId);

    // Fetch mentorship preferences
    const { data: mentorshipPrefs } = await supabase
      .from('mentorship_preferences')
      .select('*')
      .eq('profile_id', profileId)
      .single();

    // Add email and related data to the profile
    const profileWithData = {
      ...profile,
      email,
      licenses: licenses || [],
      mentorship_preferences: mentorshipPrefs || null
    };

    return NextResponse.json({ profile: profileWithData });

  } catch (error) {
    console.error('Profile fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check if Supabase is configured
    if (!supabase) {
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 503 }
      );
    }

    const { id: profileId } = await params;
    const body = await request.json();

    // TODO: Add admin role check here
    // For now, allow access to anyone (we'll secure this later)

    // Validate allowed fields for profile updates
    const allowedProfileFields = [
      'visibility_state', 'is_listed', 'first_name', 'last_name', 'headline', 
      'bio', 'firm_name', 'credential_type', 'public_email', 'phone', 
      'website_url', 'linkedin_url', 'accepting_work', 'public_contact',
      'works_multistate', 'works_international', 'countries', 'specializations',
      'states', 'software', 'other_software', 'years_experience', 
      'entity_revenue_range', 'primary_location', 'ptin'
    ];
    
    const updateData: any = {};
    
    for (const field of allowedProfileFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    // Handle licenses update
    let licensesToUpdate = null;
    if (body.licenses !== undefined) {
      licensesToUpdate = body.licenses;
    }

    // Handle mentorship preferences update
    let mentorshipToUpdate = null;
    if (body.mentorship_preferences !== undefined) {
      mentorshipToUpdate = body.mentorship_preferences;
    }

    if (Object.keys(updateData).length === 0 && !licensesToUpdate && !mentorshipToUpdate) {
      return NextResponse.json(
        { error: 'No valid fields to update' },
        { status: 400 }
      );
    }

    // Auto-update visibility_state when listing a profile
    if (body.is_listed === true && body.visibility_state === undefined) {
      // If admin is setting is_listed to true, automatically change hidden -> pending_verification
      const { data: currentProfile } = await supabase
        .from('profiles')
        .select('visibility_state')
        .eq('id', profileId)
        .single();
      
      if (currentProfile?.visibility_state === 'hidden') {
        updateData.visibility_state = 'pending_verification';
      }
    }

    // Add updated_at timestamp
    updateData.updated_at = new Date().toISOString();

    // Update the profile
    if (Object.keys(updateData).length > 0) {
      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', profileId);

      if (error) {
        console.error('Error updating profile:', error);
        return NextResponse.json(
          { error: 'Failed to update profile' },
          { status: 500 }
        );
      }
    }

    // Update licenses if provided
    if (licensesToUpdate !== null) {
      // Delete existing licenses
      const { error: deleteError } = await supabase
        .from('licenses')
        .delete()
        .eq('profile_id', profileId);
      
      if (deleteError) {
        console.error('Error deleting existing licenses:', deleteError);
        return NextResponse.json(
          { error: 'Failed to update licenses' },
          { status: 500 }
        );
      }

      // Insert new licenses
      if (licensesToUpdate.length > 0) {
        const licenseData = licensesToUpdate.map((license: any) => ({
          profile_id: profileId,
          license_kind: license.license_kind,
          license_number: license.license_number,
          issuing_authority: license.issuing_authority,
          state: license.state || null,
          expires_on: license.expires_on || null,
          board_profile_url: license.board_profile_url || null,
          status: license.status || 'pending'
        }));

        const { error: insertError } = await supabase
          .from('licenses')
          .insert(licenseData);

        if (insertError) {
          console.error('Error inserting licenses:', insertError);
          return NextResponse.json(
            { error: 'Failed to update licenses' },
            { status: 500 }
          );
        }
      }
    }

    // Update mentorship preferences if provided
    if (mentorshipToUpdate !== null) {
      const { error: mentorshipError } = await supabase
        .from('mentorship_preferences')
        .upsert({
          profile_id: profileId,
          is_open_to_mentor: mentorshipToUpdate.is_open_to_mentor || false,
          is_seeking_mentor: mentorshipToUpdate.is_seeking_mentor || false,
          topics: mentorshipToUpdate.topics || []
        });

      if (mentorshipError) {
        console.error('Error updating mentorship preferences:', mentorshipError);
        return NextResponse.json(
          { error: 'Failed to update mentorship preferences' },
          { status: 500 }
        );
      }
    }

    // TODO: Log admin action in audit_logs table

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully'
    });

  } catch (error) {
    console.error('Profile update error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check if Supabase is configured
    if (!supabase) {
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 503 }
      );
    }

    const { id: profileId } = await params;

    // TODO: Add admin role check here
    // For now, allow access to anyone (we'll secure this later)

    // Delete the profile (this will cascade to related tables due to foreign key constraints)
    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('id', profileId);

    if (error) {
      console.error('Error deleting profile:', error);
      return NextResponse.json(
        { error: 'Failed to delete profile' },
        { status: 500 }
      );
    }

    // TODO: Log admin action in audit_logs table

    return NextResponse.json({
      success: true,
      message: 'Profile deleted successfully'
    });

  } catch (error) {
    console.error('Profile deletion error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
