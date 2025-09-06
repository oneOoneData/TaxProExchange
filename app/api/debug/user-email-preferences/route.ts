import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { shouldSendEmail, type EmailPreferences } from '@/lib/email';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const profileId = url.searchParams.get('profileId');
    
    if (!profileId) {
      return NextResponse.json({ 
        error: 'profileId parameter required',
        example: '/api/debug/user-email-preferences?profileId=123'
      }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: 'Database configuration missing' }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get user profile and email preferences
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, public_email, email_preferences, connection_email_notifications')
      .eq('id', profileId)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ 
        error: 'Profile not found',
        details: profileError?.message 
      }, { status: 404 });
    }

    const emailPreferences = profile.email_preferences as EmailPreferences | null;
    const shouldReceiveMessages = shouldSendEmail(emailPreferences, 'message_notifications');
    const shouldReceiveConnections = shouldSendEmail(emailPreferences, 'connection_requests');

    return NextResponse.json({
      profile: {
        id: profile.id,
        name: `${profile.first_name} ${profile.last_name}`,
        email: profile.public_email,
        hasEmail: !!profile.public_email
      },
      preferences: {
        email_preferences: emailPreferences,
        connection_email_notifications: profile.connection_email_notifications
      },
      emailSettings: {
        message_notifications: emailPreferences?.message_notifications,
        connection_requests: emailPreferences?.connection_requests,
        shouldReceiveMessages,
        shouldReceiveConnections
      },
      debug: {
        emailPreferencesType: typeof emailPreferences,
        emailPreferencesNull: emailPreferences === null,
        messageNotificationsValue: emailPreferences?.message_notifications,
        messageNotificationsType: typeof emailPreferences?.message_notifications
      }
    });

  } catch (error) {
    console.error('Debug user email preferences error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
