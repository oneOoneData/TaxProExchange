import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';
import { getServerStreamClient } from '@/lib/stream';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { connectionId } = await req.json();
    if (!connectionId) {
      return NextResponse.json({ error: 'Connection ID required' }, { status: 400 });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get the connection
    const { data: connection, error: connectionError } = await supabase
      .from('connections')
      .select('*')
      .eq('id', connectionId)
      .eq('status', 'accepted')
      .single();

    if (connectionError || !connection) {
      return NextResponse.json({ error: 'Connection not found or not accepted' }, { status: 404 });
    }

    // Check if channel already exists
    if (connection.stream_channel_id) {
      return NextResponse.json({ 
        success: true, 
        message: 'Channel already exists',
        channelId: connection.stream_channel_id 
      });
    }

    // Check if Stream environment variables are set
    if (!process.env.STREAM_KEY || !process.env.STREAM_SECRET) {
      console.error('Stream Chat environment variables not set:', {
        hasStreamKey: !!process.env.STREAM_KEY,
        hasStreamSecret: !!process.env.STREAM_SECRET,
        hasStreamAppId: !!process.env.STREAM_APP_ID
      });
      return NextResponse.json({ 
        error: 'Stream Chat environment variables not set (STREAM_KEY, STREAM_SECRET)',
        details: 'Please add STREAM_KEY and STREAM_SECRET to your environment variables'
      }, { status: 500 });
    }

    const streamClient = getServerStreamClient();
    
    // Get both participant profile IDs
    const memberA = String(connection.requester_profile_id);
    const memberB = String(connection.recipient_profile_id);
    
    // Get profile information for both users
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, avatar_url')
      .in('id', [memberA, memberB]);
    
    if (profilesError || !profiles || profiles.length !== 2) {
      return NextResponse.json({ 
        error: 'Failed to fetch profile information' 
      }, { status: 500 });
    }
    
    // Create/update user objects in Stream Chat
    for (const profile of profiles) {
      await streamClient.upsertUser({
        id: profile.id,
        name: `${profile.first_name} ${profile.last_name}`,
        image: profile.avatar_url,
      });
    }
    
    console.log('Stream users created/updated for:', profiles.map(p => p.id));
    
    // Create a unique channel ID for this connection
    const channelId = `conn_${connection.id}`;
    
    // Create the Stream channel
    const channel = streamClient.channel('messaging', channelId, {
      created_by_id: memberA,
      members: [memberA, memberB],
    });
    
    await channel.create();
    
    // Update connection with Stream channel ID
    const { data: saved, error: saveError } = await supabase
      .from('connections')
      .update({ stream_channel_id: channel.id })
      .eq('id', connection.id)
      .select()
      .single();
    
    if (saveError) {
      console.error('Failed to save Stream channel ID:', saveError);
      return NextResponse.json({ error: 'Failed to save channel ID' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      channelId: channel.id,
      message: 'Stream channel created successfully'
    });

  } catch (error) {
    console.error('Stream channel creation error:', error);
    return NextResponse.json({ 
      error: 'Failed to create Stream channel',
      details: error.message 
    }, { status: 500 });
  }
}
