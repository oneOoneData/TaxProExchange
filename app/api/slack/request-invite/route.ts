import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getCurrentProfile } from '@/lib/db/profile';
import { sendEmail } from '@/lib/email';
import { createServerClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get user profile
    const profile = await getCurrentProfile();
    if (!profile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      );
    }

    // Check if user is verified
    if (profile.visibility_state !== 'verified') {
      return NextResponse.json(
        { error: 'Only verified users can request Slack invites' },
        { status: 403 }
      );
    }

    // Get admin email addresses
    const supabase = createServerClient();
    const { data: admins, error: adminError } = await supabase
      .from("profiles")
      .select("email, full_name")
      .eq("is_admin", true)
      .not("email", "is", null);

    if (adminError || !admins || admins.length === 0) {
      console.error('Error fetching admin emails:', adminError);
      return NextResponse.json(
        { error: 'Unable to process invite request' },
        { status: 500 }
      );
    }

    // Prepare user information
    const userName = `${profile.first_name} ${profile.last_name}`.trim();
    const userEmail = profile.public_email || profile.user_id;
    const profileUrl = `${process.env.NEXT_PUBLIC_APP_URL}/p/${profile.slug}`;

    // Send notification emails to all admins
    const emailPromises = admins.map(admin => 
      sendEmail({
        to: admin.email,
        subject: `Slack Invite Request from ${userName}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #4A154B;">Slack Community Invite Request</h2>
            
            <p>A verified member has requested an invite to the TaxProExchange Slack community:</p>
            
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #4A154B;">Member Details</h3>
              <p><strong>Name:</strong> ${userName}</p>
              <p><strong>Email:</strong> ${userEmail}</p>
              <p><strong>Profile:</strong> <a href="${profileUrl}" style="color: #4A154B;">View Profile</a></p>
              <p><strong>Credential:</strong> ${profile.credential_type || 'Not specified'}</p>
              <p><strong>Location:</strong> ${profile.states || 'Not specified'}</p>
            </div>
            
            <p>To invite this member to Slack:</p>
            <ol>
              <li>Go to your Slack workspace</li>
              <li>Click "Invite people" or use the invite link</li>
              <li>Enter their email: <strong>${userEmail}</strong></li>
              <li>Send the invite</li>
            </ol>
            
            <p style="margin-top: 30px; font-size: 14px; color: #666;">
              This request was sent from the TaxProExchange dashboard.
            </p>
          </div>
        `,
        text: `
Slack Community Invite Request

A verified member has requested an invite to the TaxProExchange Slack community:

Member Details:
- Name: ${userName}
- Email: ${userEmail}
- Profile: ${profileUrl}
- Credential: ${profile.credential_type || 'Not specified'}
- Location: ${profile.states || 'Not specified'}

To invite this member to Slack:
1. Go to your Slack workspace
2. Click "Invite people" or use the invite link
3. Enter their email: ${userEmail}
4. Send the invite

This request was sent from the TaxProExchange dashboard.
        `,
        replyTo: 'support@taxproexchange.com',
      })
    );

    try {
      await Promise.all(emailPromises);
      console.log(`Slack invite request notifications sent to ${admins.length} admins for user: ${userEmail}`);
    } catch (emailError) {
      console.error("Error sending admin notification emails:", emailError);
      return NextResponse.json(
        { error: 'Failed to send notification' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Invite request sent to admins'
    });

  } catch (error) {
    console.error('Error processing Slack invite request:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
