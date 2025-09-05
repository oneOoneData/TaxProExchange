import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendEmail } from '@/lib/email';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    // Get all pending connection requests
    const { data: pendingConnections, error: connectionsError } = await supabase
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
      .eq('status', 'pending')
      .eq('recipient.connection_email_notifications', true);

    if (connectionsError) {
      console.error('Error fetching pending connections:', connectionsError);
      return NextResponse.json(
        { error: 'Failed to fetch pending connections' },
        { status: 500 }
      );
    }

    if (!pendingConnections || pendingConnections.length === 0) {
      return NextResponse.json({
        message: 'No pending connections with email notifications enabled',
        count: 0
      });
    }

    // Group connections by recipient to avoid sending multiple emails to the same person
    const recipientConnections = new Map();
    
    for (const connection of pendingConnections) {
      const recipientId = connection.recipient_profile_id;
      if (!recipientConnections.has(recipientId)) {
        recipientConnections.set(recipientId, []);
      }
      recipientConnections.get(recipientId).push(connection);
    }

    const results = {
      totalRecipients: recipientConnections.size,
      totalConnections: pendingConnections.length,
      emailsSent: 0,
      emailsFailed: 0,
      errors: [] as string[]
    };

    // Send emails to each recipient
    for (const [recipientId, connections] of recipientConnections) {
      try {
        const recipient = connections[0].recipient;
        
        // Get recipient's email - try public_email first, then Clerk API
        let userEmail: string | null = recipient.public_email || null;
        
        console.log(`Processing recipient ${recipientId}: public_email = ${userEmail}, clerk_id = ${recipient.clerk_id}`);
        
        if (!userEmail) {
          try {
            const response = await fetch(`https://api.clerk.com/v1/users/${recipient.clerk_id}`, {
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
            } else {
              console.log(`Clerk API returned ${response.status} for ${recipient.clerk_id}`);
            }
          } catch (error) {
            console.error(`Error fetching email from Clerk for recipient ${recipientId}:`, error);
          }
        }

        if (!userEmail) {
          results.errors.push(`Email not found for recipient ${recipientId} (public_email: ${recipient.public_email}, clerk_id: ${recipient.clerk_id})`);
          results.emailsFailed++;
          continue;
        }

        console.log(`Found email for recipient ${recipientId}: ${userEmail}`);

        // Prepare email content
        const recipientName = recipient.first_name;
        const pendingCount = connections.length;
        
        // Create list of requesters
        const requesterList = connections.map(conn => {
          const requester = conn.requester;
          const firmName = requester.firm_name ? ` at ${requester.firm_name}` : '';
          return `${requester.first_name} ${requester.last_name}${firmName}`;
        }).join(', ');

        const viewRequestUrl = `${process.env.NEXT_PUBLIC_APP_URL}/messages`;
        const notificationSettingsUrl = `${process.env.NEXT_PUBLIC_APP_URL}/settings`;

        // Send email
        console.log(`Sending email to ${userEmail} for ${pendingCount} pending requests`);
        const emailResult = await sendEmail({
          to: userEmail,
          subject: `You have ${pendingCount} pending connection request${pendingCount > 1 ? 's' : ''} on TaxProExchange`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2 style="color: #1f2937; margin-bottom: 20px;">Pending Connection Request${pendingCount > 1 ? 's' : ''}</h2>
              
              <p>Hi ${recipientName},</p>
              
              <p>You have ${pendingCount} pending connection request${pendingCount > 1 ? 's' : ''} on TaxProExchange waiting for your response.</p>
              <p>These requests are a simple way to find trusted partners for referrals, overflow work, or specialized help.</p>
              
              <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <p style="margin: 0; font-weight: bold;">Request${pendingCount > 1 ? 's' : ''} from:</p>
                <p style="margin: 5px 0 0 0; color: #6b7280;">${requesterList}</p>
              </div>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${viewRequestUrl}" 
                   style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
                  👉 View Request${pendingCount > 1 ? 's' : ''}
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

You have ${pendingCount} pending connection request${pendingCount > 1 ? 's' : ''} on TaxProExchange waiting for your response.
These requests are a simple way to find trusted partners for referrals, overflow work, or specialized help.

Request${pendingCount > 1 ? 's' : ''} from: ${requesterList}

View Request${pendingCount > 1 ? 's' : ''}: ${viewRequestUrl}

If you'd prefer not to receive email reminders like this, you can update your notification settings anytime here: ${notificationSettingsUrl}.

Thanks for being part of the community,
The TaxProExchange Team
          `
        });

        if (emailResult.success) {
          results.emailsSent++;
        } else {
          results.emailsFailed++;
          results.errors.push(`Failed to send email to ${userEmail}`);
        }

      } catch (error) {
        console.error(`Error sending email to recipient ${recipientId}:`, error);
        results.emailsFailed++;
        results.errors.push(`Error sending email to recipient ${recipientId}: ${error}`);
      }
    }

    return NextResponse.json({
      message: 'Connection reminder emails processed',
      ...results
    });

  } catch (error) {
    console.error('Error processing connection reminders:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
