import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';
import { getServerStreamClient } from '@/lib/stream';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get current user's profile - try both clerk_id and clerk_user_id
    let { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('clerk_id', userId)
      .single();

    // If not found with clerk_id, try clerk_user_id
    if (profileError && profileError.code === 'PGRST116') {
      const { data: profile2, error: profileError2 } = await supabase
        .from('profiles')
        .select('id')
        .eq('clerk_user_id', userId)
        .single();
      
      if (!profileError2) {
        profile = profile2;
        profileError = null;
      }
    }

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // Get all accepted connections for this user
    const { data: connections, error: connectionsError } = await supabase
      .from('connections')
      .select('id, stream_channel_id')
      .or(`requester_profile_id.eq.${profile.id},recipient_profile_id.eq.${profile.id}`)
      .eq('status', 'accepted')
      .not('stream_channel_id', 'is', null);

    if (connectionsError) {
      console.error('Connections fetch error:', connectionsError);
      return NextResponse.json({ error: 'Failed to fetch connections' }, { status: 500 });
    }

    // Query Stream Chat for actual unread messages and threads
    let hasUnreadMessages = false;
    let unreadCount = 0;
    const threads: any[] = [];

    try {
      // Check if Stream is configured
      if (!process.env.STREAM_KEY || !process.env.STREAM_SECRET) {
        console.warn('Stream Chat not configured - skipping unread count');
      } else {
        const streamClient = getServerStreamClient();
        
        // Query channels where this user is a member
        const channelsResponse = await streamClient.queryChannels(
          {
            members: { $in: [profile.id] },
            type: 'messaging'
          },
          [{ last_message_at: -1 }], // Sort by most recent message
          {
            state: true,
            watch: false,
            presence: false,
            limit: 10 // Get up to 10 recent conversations
          }
        );

        // Process channels to get threads and count unread
        for (const channel of channelsResponse) {
          const unread = channel.state?.read?.[profile.id]?.unread_messages || 0;
          unreadCount += unread;

          // Get the other member(s) in the channel
          const otherMembers = Object.keys(channel.state?.members || {})
            .filter(memberId => memberId !== profile.id);
          
          // Get the last message
          const messages = channel.state?.messages || [];
          const lastMessage = messages[messages.length - 1];

          if (lastMessage && otherMembers.length > 0) {
            // Get other member's profile
            const otherMemberId = otherMembers[0];
            const otherMember = channel.state?.members?.[otherMemberId];

            // Fetch profile details from database
            const { data: counterpartProfile } = await supabase
              .from('profiles')
              .select('id, first_name, last_name, avatar_url')
              .eq('id', otherMemberId)
              .single();

            if (counterpartProfile) {
              threads.push({
                id: channel.id || '',
                counterpartId: counterpartProfile.id,
                counterpartName: `${counterpartProfile.first_name} ${counterpartProfile.last_name}`,
                counterpartAvatar: counterpartProfile.avatar_url,
                lastMessage: lastMessage.text || '(message)',
                lastMessageTime: lastMessage.created_at,
                unreadCount: unread
              });
            }
          }
        }

        hasUnreadMessages = unreadCount > 0;
      }
    } catch (streamError) {
      console.error('Error fetching unread from Stream:', streamError);
      // Don't fail the whole request if Stream is unavailable
      // Just return 0 unread messages
    }

    return NextResponse.json({
      hasUnreadMessages,
      unreadCount,
      connectionsCount: connections?.length || 0,
      threads: threads.slice(0, 5) // Return top 5 threads
    });

  } catch (error) {
    console.error('Unread messages check error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
