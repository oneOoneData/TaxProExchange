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
      .select('id, user_id, first_name, slug, notified_verified_listed_at, visibility_state, is_listed, public_email')
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
    // Check the UPDATED profile data (now verified and listed)
    const { data: updatedProfile, error: updatedProfileError } = await supabase
      .from('profiles')
      .select('id, user_id, first_name, slug, notified_verified_listed_at, visibility_state, is_listed, public_email')
      .eq('id', profileId)
      .single();

    if (updatedProfileError) {
      console.error('Error fetching updated profile:', updatedProfileError);
    } else {
      console.log('🔍 Email check - Updated profile data:', {
        id: updatedProfile.id,
        slug: updatedProfile.slug,
        notified_verified_listed_at: updatedProfile.notified_verified_listed_at,
        user_id: updatedProfile.user_id,
        public_email: updatedProfile.public_email,
        visibility_state: updatedProfile.visibility_state,
        is_listed: updatedProfile.is_listed
      });

      // Only send email if:
      // 1. Profile is verified and listed
      // 2. Has a slug (for profile URL)
      // 3. Has not been notified before
      // 4. Has an email address
      const shouldSendEmail = (
        updatedProfile.visibility_state === 'verified' &&
        updatedProfile.is_listed === true &&
        !updatedProfile.notified_verified_listed_at &&
        updatedProfile.slug &&
        (updatedProfile.public_email || updatedProfile.user_id)
      );

      if (shouldSendEmail) {
        try {
          console.log('📧 Attempting to send email for profile:', profileId);
          
          let emailToSend = null;
          
          // Try to get email from users table first
          if (updatedProfile.user_id) {
            const { data: userData, error: userError } = await supabase
              .from('users')
              .select('email')
              .eq('id', updatedProfile.user_id)
              .single();

            console.log('👤 User data:', { userData, userError });

            if (!userError && userData?.email) {
              emailToSend = userData.email;
            }
          }
          
          // Fallback to public_email if no user email found
          if (!emailToSend && updatedProfile.public_email) {
            console.log('📧 Using public_email:', updatedProfile.public_email);
            emailToSend = updatedProfile.public_email;
          }

          if (emailToSend) {
            console.log('📤 Sending email to:', emailToSend);
            
            const emailResult = await sendVerifiedListedEmail({
              to: emailToSend,
              firstName: updatedProfile.first_name,
              slug: updatedProfile.slug,
            });

            console.log('📧 Email send result:', emailResult);

            // Mark as notified (with additional safety check)
            const { error: notifyError } = await supabase
              .from('profiles')
              .update({ notified_verified_listed_at: new Date().toISOString() })
              .eq('id', profileId)
              .is('notified_verified_listed_at', null); // Only update if still null

            if (notifyError) {
              console.warn('⚠️ Could not mark as notified (may have been sent already):', notifyError);
            } else {
              console.log('✅ Profile marked as notified');
            }

            console.log('✅ Verified + listed email sent to:', emailToSend);
          } else {
            console.warn('❌ Could not find any email for profile:', profileId, { 
              user_id: updatedProfile.user_id, 
              public_email: updatedProfile.public_email 
            });
          }
        } catch (emailError) {
          // Don't fail the approval if email fails
          console.error('❌ Failed to send verified + listed email:', emailError);
        }
      } else if (updatedProfile.notified_verified_listed_at) {
        console.log('📧 Email already sent for profile:', profileId);
      } else {
        console.warn('❌ Cannot send email - missing requirements:', {
          isVerified: updatedProfile.visibility_state === 'verified',
          isListed: updatedProfile.is_listed === true,
          hasSlug: !!updatedProfile.slug,
          hasEmail: !!(updatedProfile.public_email || updatedProfile.user_id),
          alreadyNotified: !!updatedProfile.notified_verified_listed_at
        });
      }
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
