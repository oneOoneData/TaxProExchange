import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendMessageNotification, shouldSendEmail, type EmailPreferences } from '@/lib/email';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    // Verify this is a message.new event from Stream
    if (body.type !== 'message.new') {
      return NextResponse.json({ success: true });
    }

    const message = body.message;
    const channel = body.channel;
    
    if (!message || !channel) {
      return NextResponse.json({ success: true });
    }

    // Get channel members (excluding the sender)
    const members = Object.keys(channel.state.members || {});
    const senderId = message.user?.id;
    
    if (!senderId || members.length < 2) {
      return NextResponse.json({ success: true });
    }

    // Find the recipient (the other member)
    const recipientId = members.find(id => id !== senderId);
    if (!recipientId) {
      return NextResponse.json({ success: true });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      console.error('Supabase configuration missing');
      return NextResponse.json({ success: true });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get recipient profile details
    const { data: recipientProfile, error: recipientError } = await supabase
      .from('profiles')
      .select('first_name, last_name, email, email_preferences')
      .eq('id', recipientId)
      .single();

    if (recipientError || !recipientProfile) {
      console.error('Failed to fetch recipient profile:', recipientError);
      return NextResponse.json({ success: true });
    }

    // Get sender profile details
    const { data: senderProfile, error: senderError } = await supabase
      .from('profiles')
      .select('first_name, last_name, firm_name')
      .eq('id', senderId)
      .single();

    if (senderError || !senderProfile) {
      console.error('Failed to fetch sender profile:', senderError);
      return NextResponse.json({ success: true });
    }

    // Check if recipient wants message notifications
    const emailPreferences = recipientProfile.email_preferences as EmailPreferences | null;
    if (!shouldSendEmail(emailPreferences, 'message_notifications')) {
      return NextResponse.json({ success: true });
    }

    // Send email notification
    const messagePreview = message.text?.substring(0, 100) || 'New message';
    const messageLink = `${process.env.NEXT_PUBLIC_APP_URL || 'https://taxproexchange.com'}/messages`;

    await sendMessageNotification({
      senderName: `${senderProfile.first_name} ${senderProfile.last_name}`,
      senderFirm: senderProfile.firm_name || '',
      recipientName: `${recipientProfile.first_name} ${recipientProfile.last_name}`,
      recipientEmail: recipientProfile.email || '',
      messagePreview,
      messageLink
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Stream webhook error:', error);
    return NextResponse.json({ success: true }); // Always return success to Stream
  }
}
