import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';
import { getServerStreamClient } from '@/lib/stream';

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({ error: 'Database configuration error' }, { status: 500 });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // Get user's profile ID
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('clerk_id', userId)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // Get all accepted connections for this user
    const { data: connections, error: connectionsError } = await supabase
      .from('connections')
      .select('id, stream_channel_id')
      .eq('status', 'accepted')
      .or(`requester_profile_id.eq.${profile.id},recipient_profile_id.eq.${profile.id}`);

    if (connectionsError) {
      console.error('Failed to fetch connections:', connectionsError);
      return NextResponse.json({ error: 'Failed to fetch connections' }, { status: 500 });
    }

    if (!connections || connections.length === 0) {
      return NextResponse.json({ hasUnreadMessages: false, unreadCount: 0 });
    }

    // Check Stream Chat for unread messages
    const streamClient = getServerStreamClient();
    let totalUnreadCount = 0;
    let hasUnreadMessages = false;

    for (const connection of connections) {
      if (!connection.stream_channel_id) continue;

      try {
        // Get channel from Stream
        const channel = streamClient.channel('messaging', connection.stream_channel_id);
        await channel.watch();

        // Get unread count for this user
        const unreadCount = (channel.state.unreadCount as any)[profile.id] || 0;
        
        if (unreadCount > 0) {
          hasUnreadMessages = true;
          totalUnreadCount += unreadCount;
        }
      } catch (streamError) {
        console.error(`Failed to check unread messages for channel ${connection.stream_channel_id}:`, streamError);
        // Continue checking other channels even if one fails
      }
    }

    return NextResponse.json({ 
      hasUnreadMessages, 
      unreadCount: totalUnreadCount 
    });

  } catch (error) {
    console.error('Error checking unread messages:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
