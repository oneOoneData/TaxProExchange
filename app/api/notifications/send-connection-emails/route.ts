import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

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
    for (const [recipientId, connections] of Array.from(recipientConnections.entries())) {
      try {
        const recipient = connections[0].recipient;
        
        // Get recipient's email - try public_email first, then Clerk API
        let userEmail: string | null = recipient.public_email || null;
        
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
            }
          } catch (error) {
            console.error(`Error fetching email from Clerk for recipient ${recipientId}:`, error);
          }
        }

        if (!userEmail) {
          results.errors.push(`Email not found for recipient ${recipientId}`);
          results.emailsFailed++;
          continue;
        }

        // Send individual connection request email for each connection
        for (const connection of connections) {
          try {
            const emailResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/notifications/connection-request`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                connectionId: connection.id,
                recipientProfileId: connection.recipient_profile_id
              }),
            });

            if (emailResponse.ok) {
              results.emailsSent++;
            } else {
              results.emailsFailed++;
              const errorData = await emailResponse.json().catch(() => ({}));
              results.errors.push(`Failed to send email for connection ${connection.id}: ${errorData.error || 'Unknown error'}`);
            }
          } catch (emailError) {
            results.emailsFailed++;
            results.errors.push(`Error sending email for connection ${connection.id}: ${emailError}`);
          }
        }

      } catch (error) {
        console.error(`Error processing recipient ${recipientId}:`, error);
        results.emailsFailed++;
        results.errors.push(`Error processing recipient ${recipientId}: ${error}`);
      }
    }

    return NextResponse.json({
      message: 'Connection request emails processed',
      ...results
    });

  } catch (error) {
    console.error('Error processing connection emails:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
