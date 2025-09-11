import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendEmail } from '@/lib/email';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Helper function to get user email from Clerk ID
async function getUserEmailFromClerk(clerkId: string): Promise<string | null> {
  try {
    const response = await fetch(`https://api.clerk.com/v1/users/${clerkId}`, {
      headers: {
        'Authorization': `Bearer ${process.env.CLERK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      const user = await response.json();
      return user.email_addresses?.[0]?.email_address || null;
    }
    return null;
  } catch (error) {
    console.error(`Error fetching user ${clerkId} from Clerk:`, error);
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      connection_id,
      requester_name,
      requester_headline,
      requester_firm
    } = body;

    if (!connection_id || !requester_name) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get connection details
    const { data: connection, error: connectionError } = await supabase
      .from('connections')
      .select(`
        id,
        requester_profile_id,
        recipient_profile_id,
        status,
        created_at
      `)
      .eq('id', connection_id)
      .single();

    if (connectionError || !connection) {
      console.error('Failed to get connection details:', connectionError);
      return NextResponse.json({ error: 'Connection not found' }, { status: 404 });
    }

    // Get recipient profile details
    const { data: recipientProfile, error: recipientError } = await supabase
      .from('profiles')
      .select('first_name, last_name, clerk_id, email_preferences')
      .eq('id', connection.recipient_profile_id)
      .single();

    if (recipientError || !recipientProfile) {
      console.error('Failed to get recipient profile:', recipientError);
      return NextResponse.json({ error: 'Recipient profile not found' }, { status: 404 });
    }

    // Check email preferences
    const emailPrefs = recipientProfile.email_preferences || {};
    if (emailPrefs.connection_requests === false) {
      return NextResponse.json({ 
        success: true, 
        message: 'Email notification skipped due to user preferences' 
      });
    }

    // Fetch real email from Clerk
    let recipientEmail = 'no-email@example.com';
    if (recipientProfile.clerk_id) {
      const realEmail = await getUserEmailFromClerk(recipientProfile.clerk_id);
      if (realEmail) {
        recipientEmail = realEmail;
      }
    }

    const recipientName = `${recipientProfile.first_name} ${recipientProfile.last_name}`;

    // Create email content
    const subject = `New connection request from ${requester_name}`;
    
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1f2937;">New Connection Request</h2>
        
        <p>Hello ${recipientName},</p>
        
        <p>You've received a new connection request from a fellow tax professional:</p>
        
        <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin: 0 0 10px 0; color: #1f2937;">${requester_name}</h3>
          ${requester_headline ? `<p style="margin: 5px 0; color: #6b7280; font-style: italic;">${requester_headline}</p>` : ''}
          ${requester_firm ? `<p style="margin: 5px 0; color: #6b7280;">${requester_firm}</p>` : ''}
        </div>
        
        <p>This person would like to connect with you on TaxProExchange. You can accept or decline their request.</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/messages" 
             style="background-color: #1f2937; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            View Connection Request
          </a>
        </div>
        
        <p>Building connections with other tax professionals can help you find new opportunities and collaborate on projects.</p>
        
        <p>Best regards,<br>The TaxProExchange Team</p>
        
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
        <p style="font-size: 12px; color: #6b7280;">
          This is an automated notification from TaxProExchange. 
          Please do not reply to this email.
        </p>
      </div>
    `;

    const textContent = `
New Connection Request

Hello ${recipientName},

You've received a new connection request from a fellow tax professional:

${requester_name}
${requester_headline ? requester_headline : ''}
${requester_firm ? requester_firm : ''}

This person would like to connect with you on TaxProExchange. You can accept or decline their request.

View Connection Request: ${process.env.NEXT_PUBLIC_APP_URL}/messages

Building connections with other tax professionals can help you find new opportunities and collaborate on projects.

Best regards,
The TaxProExchange Team

---
This is an automated notification from TaxProExchange. Please do not reply to this email.
    `;

    // Send email
    try {
      await sendEmail({
        to: recipientEmail,
        subject,
        html: htmlContent,
        text: textContent
      });
      
      console.log(`Connection request notification sent to ${recipientEmail}`);
    } catch (emailError) {
      console.error('Failed to send connection request notification:', emailError);
      return NextResponse.json(
        { error: 'Failed to send notification email' },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Connection request notification sent successfully' 
    });

  } catch (error) {
    console.error('Connection request notification error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
