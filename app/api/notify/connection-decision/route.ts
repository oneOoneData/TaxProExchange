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
      decision,
      responder_name,
      responder_firm
    } = body;

    if (!connection_id || !decision || !responder_name) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (!['accepted', 'declined'].includes(decision)) {
      return NextResponse.json(
        { error: 'Invalid decision' },
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
        status
      `)
      .eq('id', connection_id)
      .single();

    if (connectionError || !connection) {
      console.error('Failed to get connection details:', connectionError);
      return NextResponse.json({ error: 'Connection not found' }, { status: 404 });
    }

    // Get requester profile details
    const { data: requesterProfile, error: requesterError } = await supabase
      .from('profiles')
      .select('first_name, last_name, clerk_id, email_preferences')
      .eq('id', connection.requester_profile_id)
      .single();

    if (requesterError || !requesterProfile) {
      console.error('Failed to get requester profile:', requesterError);
      return NextResponse.json({ error: 'Requester profile not found' }, { status: 404 });
    }

    // Check email preferences
    const emailPrefs = requesterProfile.email_preferences || {};
    if (emailPrefs.connection_requests === false) {
      return NextResponse.json({ 
        success: true, 
        message: 'Email notification skipped due to user preferences' 
      });
    }

    // Fetch real email from Clerk
    let requesterEmail = 'no-email@example.com';
    if (requesterProfile.clerk_id) {
      const realEmail = await getUserEmailFromClerk(requesterProfile.clerk_id);
      if (realEmail) {
        requesterEmail = realEmail;
      }
    }

    const requesterName = `${requesterProfile.first_name} ${requesterProfile.last_name}`;

    // Create email content based on decision
    const isAccepted = decision === 'accepted';
    const subject = isAccepted 
      ? `Connection request accepted by ${responder_name}`
      : `Connection request declined by ${responder_name}`;
    
    const statusText = isAccepted ? 'accepted' : 'declined';
    const statusColor = isAccepted ? '#10b981' : '#ef4444';
    const actionText = isAccepted 
      ? 'You can now message each other and collaborate on projects.'
      : 'You can still connect with other tax professionals on the platform.';
    
    const actionButton = isAccepted 
      ? 'Start Messaging'
      : 'Find More Connections';

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1f2937;">Connection Request ${statusText.charAt(0).toUpperCase() + statusText.slice(1)}</h2>
        
        <p>Hello ${requesterName},</p>
        
        <p>Your connection request has been <strong style="color: ${statusColor};">${statusText}</strong> by:</p>
        
        <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin: 0 0 10px 0; color: #1f2937;">${responder_name}</h3>
          ${responder_firm ? `<p style="margin: 5px 0; color: #6b7280;">${responder_firm}</p>` : ''}
        </div>
        
        <p>${actionText}</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/messages" 
             style="background-color: ${isAccepted ? '#10b981' : '#1f2937'}; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            ${actionButton}
          </a>
        </div>
        
        ${isAccepted ? `
          <p>You can now:</p>
          <ul style="margin: 10px 0; padding-left: 20px;">
            <li>Send direct messages to each other</li>
            <li>Collaborate on projects</li>
            <li>Share job opportunities</li>
            <li>Build your professional network</li>
          </ul>
        ` : `
          <p>Don't be discouraged! There are many other tax professionals on TaxProExchange who would love to connect with you.</p>
        `}
        
        <p>Best regards,<br>The TaxProExchange Team</p>
        
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
        <p style="font-size: 12px; color: #6b7280;">
          This is an automated notification from TaxProExchange. 
          Please do not reply to this email.
        </p>
      </div>
    `;

    const textContent = `
Connection Request ${statusText.charAt(0).toUpperCase() + statusText.slice(1)}

Hello ${requesterName},

Your connection request has been ${statusText} by:

${responder_name}
${responder_firm ? responder_firm : ''}

${actionText}

${actionButton}: ${process.env.NEXT_PUBLIC_APP_URL}/messages

${isAccepted ? `
You can now:
- Send direct messages to each other
- Collaborate on projects
- Share job opportunities
- Build your professional network
` : `
Don't be discouraged! There are many other tax professionals on TaxProExchange who would love to connect with you.
`}

Best regards,
The TaxProExchange Team

---
This is an automated notification from TaxProExchange. Please do not reply to this email.
    `;

    // Send email
    try {
      await sendEmail({
        to: requesterEmail,
        subject,
        html: htmlContent,
        text: textContent
      });
      
      console.log(`Connection decision notification sent to ${requesterEmail}`);
    } catch (emailError) {
      console.error('Failed to send connection decision notification:', emailError);
      return NextResponse.json(
        { error: 'Failed to send notification email' },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Connection decision notification sent successfully' 
    });

  } catch (error) {
    console.error('Connection decision notification error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
