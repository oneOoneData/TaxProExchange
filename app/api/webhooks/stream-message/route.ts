import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendMessageNotification, shouldSendEmail, type EmailPreferences } from '@/lib/email';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log('🔔 Stream webhook called:', body.type);
    console.log('🔔 Full webhook payload:', JSON.stringify(body, null, 2));
    
    // Verify this is a message.new event from Stream
    if (body.type !== 'message.new') {
      console.log('🔔 Not a message.new event, ignoring');
      return NextResponse.json({ success: true });
    }

    const message = body.message;
    const channel = body.channel;
    
    if (!message || !channel) {
      return NextResponse.json({ success: true });
    }

    // Get channel members (excluding the sender)
    const members = channel.members || [];
    const memberIds = members.map((member: any) => member.user_id || member.user?.id).filter(Boolean);
    const senderId = message.user?.id;
    
    console.log('🔔 Channel members array:', members);
    console.log('🔔 Member IDs:', memberIds, 'Sender ID:', senderId);
    
    if (!senderId || memberIds.length < 2) {
      console.log('🔔 Invalid sender or insufficient members');
      return NextResponse.json({ success: true });
    }

    // Find the recipient (the other member)
    const recipientId = memberIds.find(id => id !== senderId);
    if (!recipientId) {
      console.log('🔔 No recipient found');
      return NextResponse.json({ success: true });
    }
    
    console.log('🔔 Processing message from', senderId, 'to', recipientId);

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
      .select('first_name, last_name, public_email, email_preferences')
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

    // Check if recipient has a valid email address
    if (!recipientProfile.public_email) {
      console.log('🔔 Recipient has no public email address');
      return NextResponse.json({ success: true });
    }

    // Check if recipient wants message notifications
    const emailPreferences = recipientProfile.email_preferences as EmailPreferences | null;
    console.log('🔔 Recipient email preferences:', emailPreferences);
    console.log('🔔 Recipient email:', recipientProfile.public_email);
    console.log('🔔 Message notifications enabled:', emailPreferences?.message_notifications);
    
    if (!shouldSendEmail(emailPreferences, 'message_notifications')) {
      console.log('🔔 Recipient has disabled message notifications');
      return NextResponse.json({ success: true });
    }

    // Send email notification
    const messagePreview = message.text?.substring(0, 100) || 'New message';
    const messageLink = `${process.env.NEXT_PUBLIC_APP_URL || 'https://taxproexchange.com'}/messages`;

    console.log('🔔 Sending message notification email to:', recipientProfile.public_email);
    
    await sendMessageNotification({
      senderName: `${senderProfile.first_name} ${senderProfile.last_name}`,
      senderFirm: senderProfile.firm_name || '',
      recipientName: `${recipientProfile.first_name} ${recipientProfile.last_name}`,
      recipientEmail: recipientProfile.public_email || '',
      messagePreview,
      messageLink
    });
    
    console.log('🔔 Message notification email sent successfully');

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Stream webhook error:', error);
    return NextResponse.json({ success: true }); // Always return success to Stream
  }
}
