import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.warn('Supabase environment variables not configured');
}

const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

export async function GET(request: NextRequest) {
  try {
    // Check if Supabase is configured
    if (!supabase) {
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 503 }
      );
    }

    const { searchParams } = new URL(request.url);
    const profileId = searchParams.get('profileId');
    const action = searchParams.get('action');

    if (!profileId || !action) {
      return NextResponse.json(
        { error: 'Profile ID and action are required' },
        { status: 400 }
      );
    }

    // TODO: Add admin role check here
    // For now, allow access to anyone (we'll secure this later)

    // Get the current profile data
    const { data: currentProfile, error: profileFetchError } = await supabase
      .from('profiles')
      .select('id, user_id, first_name, last_name, slug, notified_verified_listed_at, visibility_state, is_listed, public_email')
      .eq('id', profileId)
      .single();

    if (profileFetchError || !currentProfile) {
      console.error('Error fetching profile:', profileFetchError);
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      );
    }

    let updateData: any = {};

    if (action === 'approve') {
      updateData = {
        visibility_state: 'verified',
        is_listed: true,
        updated_at: new Date().toISOString()
      };
    } else if (action === 'reject') {
      updateData = {
        visibility_state: 'rejected',
        is_listed: false,
        updated_at: new Date().toISOString()
      };
    } else {
      return NextResponse.json(
        { error: 'Invalid action. Use: approve or reject' },
        { status: 400 }
      );
    }

    // Update profile
    const { error: profileError } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', profileId);

    if (profileError) {
      console.error('Error updating profile:', profileError);
      return NextResponse.json(
        { error: 'Failed to update profile' },
        { status: 500 }
      );
    }

    // Update all licenses to verified status if approving
    if (action === 'approve') {
      const { error: licenseError } = await supabase
        .from('licenses')
        .update({ status: 'verified' })
        .eq('profile_id', profileId);

      if (licenseError) {
        console.error('Error updating licenses:', licenseError);
        // Don't fail the request, just log the error
      }
    }

    // Send verification email to user if approved
    if (action === 'approve') {
      const { data: updatedProfile } = await supabase
        .from('profiles')
        .select('id, user_id, first_name, last_name, slug, notified_verified_listed_at, visibility_state, is_listed, public_email')
        .eq('id', profileId)
        .single();

      const shouldSendEmail = (
        updatedProfile?.visibility_state === 'verified' &&
        updatedProfile?.is_listed === true &&
        updatedProfile?.slug &&
        !updatedProfile?.notified_verified_listed_at &&
        (updatedProfile?.public_email || updatedProfile?.user_id)
      );

      if (shouldSendEmail) {
        try {
          console.log('📧 Attempting to send verification email for profile:', profileId);
          
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
            console.log('📤 Sending verification email to:', emailToSend);
            
            // Import the email function
            const { sendVerifiedListedEmail } = await import('@/lib/email');
            
            await sendVerifiedListedEmail({
              to: emailToSend,
              firstName: updatedProfile.first_name,
              slug: updatedProfile.slug,
              managePrefsUrl: `${process.env.NEXT_PUBLIC_APP_URL}/settings`
            });

            // Mark as notified
            await supabase
              .from('profiles')
              .update({ notified_verified_listed_at: new Date().toISOString() })
              .eq('id', profileId);

            console.log('✅ Verification email sent successfully');
          } else {
            console.warn('❌ No email address found for profile:', profileId);
          }
        } catch (emailError) {
          console.error('❌ Failed to send verification email:', emailError);
          // Don't fail the request, just log the error
        }
      } else if (updatedProfile?.notified_verified_listed_at) {
        console.log('📧 Email already sent for profile:', profileId);
      } else {
        console.warn('❌ Cannot send email - missing requirements:', {
          isVerified: updatedProfile?.visibility_state === 'verified',
          isListed: updatedProfile?.is_listed === true,
          hasSlug: !!updatedProfile?.slug,
          hasEmail: !!(updatedProfile?.public_email || updatedProfile?.user_id),
          alreadyNotified: !!updatedProfile?.notified_verified_listed_at
        });
      }
    }

    // TODO: Log admin action in audit_logs table

    // Return a success page instead of JSON for GET requests
    const successMessage = action === 'approve' 
      ? `Profile for ${currentProfile.first_name} ${currentProfile.last_name} has been approved and is now verified!`
      : `Profile for ${currentProfile.first_name} ${currentProfile.last_name} has been rejected.`;

    return new NextResponse(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Profile ${action === 'approve' ? 'Approved' : 'Rejected'}</title>
          <style>
            body { 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
              line-height: 1.6; 
              color: #333; 
              max-width: 600px; 
              margin: 50px auto; 
              padding: 20px;
              text-align: center;
            }
            .success { 
              background: #10b981; 
              color: white; 
              padding: 30px; 
              border-radius: 8px; 
              margin-bottom: 30px;
            }
            .error { 
              background: #dc2626; 
              color: white; 
              padding: 30px; 
              border-radius: 8px; 
              margin-bottom: 30px;
            }
            .button {
              display: inline-block;
              background: #1f2937;
              color: white;
              padding: 12px 24px;
              text-decoration: none;
              border-radius: 6px;
              font-weight: 500;
              margin: 10px;
            }
          </style>
        </head>
        <body>
          <div class="${action === 'approve' ? 'success' : 'error'}">
            <h1>Profile ${action === 'approve' ? 'Approved' : 'Rejected'} Successfully</h1>
            <p>${successMessage}</p>
          </div>
          
          <div>
            <a href="/admin/profiles" class="button">View All Profiles</a>
            <a href="/admin" class="button">Admin Dashboard</a>
          </div>
          
          <div style="margin-top: 30px; font-size: 14px; color: #718096;">
            <p>TaxProExchange Admin Panel</p>
          </div>
        </body>
      </html>
    `, {
      headers: {
        'Content-Type': 'text/html',
      },
    });

  } catch (error) {
    console.error('Email approval error:', error);
    return new NextResponse(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Error</title>
          <style>
            body { 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
              line-height: 1.6; 
              color: #333; 
              max-width: 600px; 
              margin: 50px auto; 
              padding: 20px;
              text-align: center;
            }
            .error { 
              background: #dc2626; 
              color: white; 
              padding: 30px; 
              border-radius: 8px; 
              margin-bottom: 30px;
            }
            .button {
              display: inline-block;
              background: #1f2937;
              color: white;
              padding: 12px 24px;
              text-decoration: none;
              border-radius: 6px;
              font-weight: 500;
              margin: 10px;
            }
          </style>
        </head>
        <body>
          <div class="error">
            <h1>Error</h1>
            <p>An error occurred while processing your request. Please try again.</p>
          </div>
          
          <div>
            <a href="/admin/profiles" class="button">View All Profiles</a>
            <a href="/admin" class="button">Admin Dashboard</a>
          </div>
        </body>
      </html>
    `, {
      headers: {
        'Content-Type': 'text/html',
      },
      status: 500,
    });
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check if Supabase is configured
    if (!supabase) {
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 503 }
      );
    }

    const { profileId, action, adminEmail } = await request.json();

    if (!profileId || !action) {
      return NextResponse.json(
        { error: 'Profile ID and action are required' },
        { status: 400 }
      );
    }

    // TODO: Add admin role check here
    // For now, allow access to anyone (we'll secure this later)

    // Get the current profile data
    const { data: currentProfile, error: profileFetchError } = await supabase
      .from('profiles')
      .select('id, user_id, first_name, last_name, slug, notified_verified_listed_at, visibility_state, is_listed, public_email')
      .eq('id', profileId)
      .single();

    if (profileFetchError || !currentProfile) {
      console.error('Error fetching profile:', profileFetchError);
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      );
    }

    let updateData: any = {};

    if (action === 'approve') {
      updateData = {
        visibility_state: 'verified',
        is_listed: true,
        updated_at: new Date().toISOString()
      };
    } else if (action === 'reject') {
      updateData = {
        visibility_state: 'rejected',
        is_listed: false,
        updated_at: new Date().toISOString()
      };
    } else {
      return NextResponse.json(
        { error: 'Invalid action. Use: approve or reject' },
        { status: 400 }
      );
    }

    // Update profile
    const { error: profileError } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', profileId);

    if (profileError) {
      console.error('Error updating profile:', profileError);
      return NextResponse.json(
        { error: 'Failed to update profile' },
        { status: 500 }
      );
    }

    // Update all licenses to verified status if approving
    if (action === 'approve') {
      const { error: licenseError } = await supabase
        .from('licenses')
        .update({ status: 'verified' })
        .eq('profile_id', profileId);

      if (licenseError) {
        console.error('Error updating licenses:', licenseError);
        // Don't fail the request, just log the error
      }
    }

    // Send verification email to user if approved
    if (action === 'approve') {
      const { data: updatedProfile } = await supabase
        .from('profiles')
        .select('id, user_id, first_name, last_name, slug, notified_verified_listed_at, visibility_state, is_listed, public_email')
        .eq('id', profileId)
        .single();

      const shouldSendEmail = (
        updatedProfile?.visibility_state === 'verified' &&
        updatedProfile?.is_listed === true &&
        updatedProfile?.slug &&
        !updatedProfile?.notified_verified_listed_at &&
        (updatedProfile?.public_email || updatedProfile?.user_id)
      );

      if (shouldSendEmail) {
        try {
          console.log('📧 Attempting to send verification email for profile:', profileId);
          
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
            console.log('📤 Sending verification email to:', emailToSend);
            
            // Import the email function
            const { sendVerifiedListedEmail } = await import('@/lib/email');
            
            await sendVerifiedListedEmail({
              to: emailToSend,
              firstName: updatedProfile.first_name,
              slug: updatedProfile.slug,
              managePrefsUrl: `${process.env.NEXT_PUBLIC_APP_URL}/settings`
            });

            // Mark as notified
            await supabase
              .from('profiles')
              .update({ notified_verified_listed_at: new Date().toISOString() })
              .eq('id', profileId);

            console.log('✅ Verification email sent successfully');
          } else {
            console.warn('❌ No email address found for profile:', profileId);
          }
        } catch (emailError) {
          console.error('❌ Failed to send verification email:', emailError);
          // Don't fail the request, just log the error
        }
      } else if (updatedProfile?.notified_verified_listed_at) {
        console.log('📧 Email already sent for profile:', profileId);
      } else {
        console.warn('❌ Cannot send email - missing requirements:', {
          isVerified: updatedProfile?.visibility_state === 'verified',
          isListed: updatedProfile?.is_listed === true,
          hasSlug: !!updatedProfile?.slug,
          hasEmail: !!(updatedProfile?.public_email || updatedProfile?.user_id),
          alreadyNotified: !!updatedProfile?.notified_verified_listed_at
        });
      }
    }

    // TODO: Log admin action in audit_logs table

    return NextResponse.json({
      success: true,
      message: `Profile ${action}d successfully`,
      profileId,
      action
    });

  } catch (error) {
    console.error('Email approval error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
