import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const token = url.searchParams.get('token');
    const type = url.searchParams.get('type') || 'all';
    
    if (!token) {
      return NextResponse.json({ 
        error: 'Missing unsubscribe token' 
      }, { status: 400 });
    }

    // Decode the token (in a real implementation, you'd want to use JWT or similar)
    // For now, we'll use a simple base64 encoded profile ID
    let profileId: string;
    try {
      profileId = Buffer.from(token, 'base64').toString('utf-8');
    } catch (error) {
      return NextResponse.json({ 
        error: 'Invalid unsubscribe token' 
      }, { status: 400 });
    }

    // Get the user's profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, email_preferences, connection_email_notifications')
      .eq('id', profileId)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ 
        error: 'Profile not found' 
      }, { status: 404 });
    }

    // Update email preferences based on type
    let updateData: any = {};
    
    if (type === 'all') {
      // Disable all email notifications
      updateData = {
        connection_email_notifications: false,
        email_preferences: {
          ...profile.email_preferences,
          message_notifications: false,
          connection_requests: false,
          job_notifications: false,
          application_updates: false,
          verification_emails: false,
          marketing_updates: false
        }
      };
    } else if (type === 'messages') {
      // Disable only message notifications
      updateData = {
        email_preferences: {
          ...profile.email_preferences,
          message_notifications: false
        }
      };
    } else if (type === 'connections') {
      // Disable only connection notifications
      updateData = {
        connection_email_notifications: false,
        email_preferences: {
          ...profile.email_preferences,
          connection_requests: false
        }
      };
    }

    // Update the profile
    const { error: updateError } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', profileId);

    if (updateError) {
      console.error('Failed to update email preferences:', updateError);
      return NextResponse.json({ 
        error: 'Failed to update preferences' 
      }, { status: 500 });
    }

    // Return success page
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Unsubscribed - TaxProExchange</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
            .success { background: #d4edda; color: #155724; padding: 15px; border-radius: 6px; margin: 20px 0; }
            .button { background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 10px 0; }
          </style>
        </head>
        <body>
          <h1>Successfully Unsubscribed</h1>
          <div class="success">
            <p><strong>You have been unsubscribed from ${type === 'all' ? 'all email notifications' : type + ' notifications'}.</strong></p>
            <p>You will no longer receive ${type === 'all' ? 'any' : 'these'} email notifications from TaxProExchange.</p>
          </div>
          <p>You can still access your account and change your preferences at any time:</p>
          <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://taxproexchange.com'}/settings" class="button">Manage Email Preferences</a>
          <p>If you have any questions, please contact us at support@taxproexchange.com</p>
        </body>
      </html>
    `;

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html',
      },
    });

  } catch (error) {
    console.error('Unsubscribe error:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}
