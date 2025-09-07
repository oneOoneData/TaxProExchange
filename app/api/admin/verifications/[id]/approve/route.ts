import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendVerifiedListedEmail } from '@/lib/email';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.warn('Supabase environment variables not configured');
}

const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

export async function POST(
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

    // First, get the current profile data to check if we need to send email
    const { data: currentProfile, error: profileFetchError } = await supabase
      .from('profiles')
      .select('id, user_id, first_name, slug, notified_verified_listed_at, visibility_state, is_listed')
      .eq('id', profileId)
      .single();

    if (profileFetchError || !currentProfile) {
      console.error('Error fetching profile:', profileFetchError);
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      );
    }

    // Update profile to verified status
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        visibility_state: 'verified',
        is_listed: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', profileId);

    if (profileError) {
      console.error('Error updating profile:', profileError);
      return NextResponse.json(
        { error: 'Failed to update profile' },
        { status: 500 }
      );
    }

    // Update all licenses to verified status
    const { error: licenseError } = await supabase
      .from('licenses')
      .update({
        status: 'verified',
        updated_at: new Date().toISOString()
      })
      .eq('profile_id', profileId);

    if (licenseError) {
      console.error('Error updating licenses:', licenseError);
      // Don't fail the whole operation if license update fails
    }

    // Send email notification if not already sent
    console.log('🔍 Email check - Profile data:', {
      id: currentProfile.id,
      slug: currentProfile.slug,
      notified_verified_listed_at: currentProfile.notified_verified_listed_at,
      user_id: currentProfile.user_id
    });

    if (!currentProfile.notified_verified_listed_at && currentProfile.slug) {
      try {
        console.log('📧 Attempting to send email for profile:', profileId);
        
        // Get user email
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('email')
          .eq('id', currentProfile.user_id)
          .single();

        console.log('👤 User data:', { userData, userError });

        if (!userError && userData?.email) {
          console.log('📤 Sending email to:', userData.email);
          
          const emailResult = await sendVerifiedListedEmail({
            to: userData.email,
            firstName: currentProfile.first_name,
            slug: currentProfile.slug,
          });

          console.log('📧 Email send result:', emailResult);

          // Mark as notified
          await supabase
            .from('profiles')
            .update({ notified_verified_listed_at: new Date().toISOString() })
            .eq('id', profileId);

          console.log('✅ Verified + listed email sent to:', userData.email);
        } else {
          console.warn('❌ Could not find user email for profile:', profileId, { userError, userData });
        }
      } catch (emailError) {
        // Don't fail the approval if email fails
        console.error('❌ Failed to send verified + listed email:', emailError);
      }
    } else if (currentProfile.notified_verified_listed_at) {
      console.log('📧 Email already sent for profile:', profileId);
    } else {
      console.warn('❌ Profile has no slug, cannot send email:', profileId);
    }

    // TODO: Log admin action in audit_logs table

    return NextResponse.json({
      success: true,
      message: 'Profile approved successfully'
    });

  } catch (error) {
    console.error('Profile approval error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
