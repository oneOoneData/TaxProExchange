import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';
import { getServerStreamClient } from '@/lib/stream';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get current user's profile
    let { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('clerk_id', userId)
      .single();

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

    try {
      if (!process.env.STREAM_KEY || !process.env.STREAM_SECRET) {
        return NextResponse.json({ error: 'Stream Chat not configured' }, { status: 500 });
      }

      const streamClient = getServerStreamClient();
      
      // Query all channels where this user is a member
      const channelsResponse = await streamClient.queryChannels(
        {
          members: { $in: [profile.id] },
          type: 'messaging'
        },
        [{ last_message_at: -1 }],
        {
          state: true,
          watch: false,
          presence: false,
          limit: 100 // Mark up to 100 channels as read
        }
      );

      let markedCount = 0;
      const errors = [];

      // Mark each channel as read
      for (const channel of channelsResponse) {
        try {
          await channel.markRead({ user_id: profile.id });
          markedCount++;
          console.log(`Marked channel ${channel.id} as read for user ${profile.id}`);
        } catch (error) {
          console.error(`Error marking channel ${channel.id} as read:`, error);
          errors.push({ channel: channel.id, error: String(error) });
        }
      }

      return NextResponse.json({
        success: true,
        markedCount,
        totalChannels: channelsResponse.length,
        errors: errors.length > 0 ? errors : undefined
      });

    } catch (streamError) {
      console.error('Error marking messages as read in Stream:', streamError);
      return NextResponse.json({ 
        error: 'Failed to mark messages as read',
        details: String(streamError)
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Mark all read error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

