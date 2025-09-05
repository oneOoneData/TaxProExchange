import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { auth } from '@clerk/nextjs/server';
import { sendConnectionRequestNotification, shouldSendEmail, type EmailPreferences } from '@/lib/email';

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { recipientProfileId } = await req.json();
  if (!recipientProfileId) return NextResponse.json({ error: 'Recipient profile ID required' }, { status: 400 });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({ error: 'Database configuration error' }, { status: 500 });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // Get current user's profile ID
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('clerk_id', userId)
      .single();

    if (profileError) {
      console.error('Profile lookup error:', profileError);
      return NextResponse.json({ error: 'Profile lookup failed' }, { status: 500 });
    }

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // Check if connection already exists
    const { data: existingConnection } = await supabase
      .from('connections')
      .select('id, status')
      .or(`and(requester_profile_id.eq.${profile.id},recipient_profile_id.eq.${recipientProfileId}),and(requester_profile_id.eq.${recipientProfileId},recipient_profile_id.eq.${profile.id})`)
      .single();

    if (existingConnection) {
      return NextResponse.json({ 
        error: 'Connection already exists',
        connection: existingConnection 
      }, { status: 400 });
    }

    // Create new connection request
    const { data: connection, error: connectionError } = await supabase
      .from('connections')
      .insert({
        requester_profile_id: profile.id,
        recipient_profile_id: recipientProfileId,
        status: 'pending'
      })
      .select()
      .single();

    if (connectionError) {
      console.error('Connection creation error:', connectionError);
      return NextResponse.json({ error: 'Failed to create connection' }, { status: 500 });
    }

    // Send email notification to recipient
    try {
      // Get recipient profile details
      const { data: recipientProfile, error: recipientError } = await supabase
        .from('profiles')
        .select('first_name, last_name, email, email_preferences')
        .eq('id', recipientProfileId)
        .single();

      if (!recipientError && recipientProfile) {
        // Get requester profile details
        const { data: requesterProfile, error: requesterError } = await supabase
          .from('profiles')
          .select('first_name, last_name, firm_name, credential_type')
          .eq('id', profile.id)
          .single();

        if (!requesterError && requesterProfile) {
          // Check if recipient wants connection request emails
          const emailPreferences = recipientProfile.email_preferences as EmailPreferences | null;
          if (shouldSendEmail(emailPreferences, 'connection_requests')) {
            await sendConnectionRequestNotification({
              requesterName: `${requesterProfile.first_name} ${requesterProfile.last_name}`,
              requesterFirm: requesterProfile.firm_name || '',
              requesterCredential: requesterProfile.credential_type || '',
              recipientName: `${recipientProfile.first_name} ${recipientProfile.last_name}`,
              recipientEmail: recipientProfile.email || '',
              acceptLink: `${process.env.NEXT_PUBLIC_APP_URL || 'https://taxproexchange.com'}/messages`
            });
          }
        }
      }
    } catch (emailError) {
      console.error('Failed to send connection request email:', emailError);
      // Don't fail the connection creation if email fails
    }

    return NextResponse.json({ 
      success: true, 
      connection,
      message: 'Connection request sent successfully'
    });

  } catch (error) {
    console.error('Connection creation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
