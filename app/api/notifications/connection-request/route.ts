import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendEmail } from '@/lib/email';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { connectionId, recipientProfileId } = await request.json();
    
    console.log('🔔 Connection request notification called:', { connectionId, recipientProfileId });

    if (!connectionId || !recipientProfileId) {
      console.log('❌ Missing required fields');
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get connection details with both requester and recipient info
    const { data: connection, error: connectionError } = await supabase
      .from('connections')
      .select(`
        id,
        status,
        created_at,
        requester_profile_id,
        recipient_profile_id,
        requester:profiles!requester_profile_id(
          id,
          first_name,
          last_name,
          firm_name,
          clerk_id
        ),
        recipient:profiles!recipient_profile_id(
          id,
          first_name,
          last_name,
          firm_name,
          clerk_id,
          public_email,
          connection_email_notifications
        )
      `)
      .eq('id', connectionId)
      .eq('recipient_profile_id', recipientProfileId)
      .single();

    if (connectionError || !connection) {
      return NextResponse.json(
        { error: 'Connection not found' },
        { status: 404 }
      );
    }

    // Check if recipient has email notifications enabled
    if (!(connection.recipient as any).connection_email_notifications) {
      return NextResponse.json(
        { message: 'Recipient has disabled connection email notifications' },
        { status: 200 }
      );
    }

    // Get recipient's email - try public_email first, then Clerk API
    let userEmail: string | null = (connection.recipient as any).public_email || null;
    
    if (!userEmail) {
      try {
        const response = await fetch(`https://api.clerk.com/v1/users/${(connection.recipient as any).clerk_id}`, {
          headers: {
            'Authorization': `Bearer ${process.env.CLERK_SECRET_KEY}`,
            'Content-Type': 'application/json',
          },
        });
        
        if (response.ok) {
          const userData = await response.json();
          if (userData.primary_email_address_id && userData.email_addresses) {
            const primaryEmail = userData.email_addresses.find((e: any) => e.id === userData.primary_email_address_id);
            if (primaryEmail) {
              userEmail = primaryEmail.email_address;
            }
          } else if (userData.email_addresses && userData.email_addresses.length > 0) {
            userEmail = userData.email_addresses[0].email_address;
          }
        }
      } catch (error) {
        console.error('Error fetching email from Clerk:', error);
      }
    }

    if (!userEmail) {
      return NextResponse.json(
        { error: 'Recipient email not found' },
        { status: 404 }
      );
    }

    // Prepare email data
    const requesterName = `${(connection.requester as any).first_name} ${(connection.requester as any).last_name}`;
    const recipientName = (connection.recipient as any).first_name;
    const firmName = (connection.requester as any).firm_name ? ` at ${(connection.requester as any).firm_name}` : '';
    
    const viewRequestUrl = `${process.env.NEXT_PUBLIC_APP_URL}/messages`;
    const notificationSettingsUrl = `${process.env.NEXT_PUBLIC_APP_URL}/settings`;

    // Send email
    console.log('📧 Attempting to send connection request email to:', userEmail);
    const emailResult = await sendEmail({
      to: userEmail,
      subject: 'You have a pending connection request on TaxProExchange',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #1f2937; margin-bottom: 20px;">New Connection Request</h2>
          
          <p>Hi ${recipientName},</p>
          
          <p>Another tax professional on TaxProExchange has sent you a connection request.</p>
          <p>These requests are a simple way to find trusted partners for referrals, overflow work, or specialized help.</p>
          
          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; font-weight: bold;">${requesterName}${firmName}</p>
            <p style="margin: 5px 0 0 0; color: #6b7280;">wants to connect with you</p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${viewRequestUrl}" 
               style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
              👉 View Request
            </a>
          </div>
          
          <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
            If you'd prefer not to receive email reminders like this, you can update your notification settings anytime 
            <a href="${notificationSettingsUrl}" style="color: #3b82f6;">here</a>.
          </p>
          
          <p style="margin-top: 30px;">
            Thanks for being part of the community,<br>
            The TaxProExchange Team
          </p>
        </div>
      `,
      text: `
Hi ${recipientName},

Another tax professional on TaxProExchange has sent you a connection request.
These requests are a simple way to find trusted partners for referrals, overflow work, or specialized help.

${requesterName}${firmName} wants to connect with you.

View Request: ${viewRequestUrl}

If you'd prefer not to receive email reminders like this, you can update your notification settings anytime here: ${notificationSettingsUrl}.

Thanks for being part of the community,
The TaxProExchange Team
      `
    });

    console.log('📧 Email result:', emailResult);

    if (emailResult.error) {
      console.error('❌ Email sending failed:', emailResult.error);
      return NextResponse.json(
        { error: 'Failed to send email', details: emailResult.error },
        { status: 500 }
      );
    }

    console.log('✅ Connection request email sent successfully');
    return NextResponse.json({
      message: 'Connection request notification sent successfully',
      connectionId,
      recipientEmail: userEmail
    });

  } catch (error) {
    console.error('Error sending connection request notification:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
