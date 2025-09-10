import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';

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

    // For now, we'll return a simple response since we don't have real-time unread tracking
    // In a full implementation, you'd track unread messages in the database
    const hasUnreadMessages = false;
    const unreadCount = 0;

    return NextResponse.json({
      hasUnreadMessages,
      unreadCount,
      connectionsCount: connections?.length || 0
    });

  } catch (error) {
    console.error('Unread messages check error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
