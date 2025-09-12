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

    // Check if user is admin (you can modify this check as needed)
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Get all accepted connections without Stream channels
    const { data: connections, error: connectionsError } = await supabase
      .from('connections')
      .select(`
        id,
        requester_profile_id,
        recipient_profile_id,
        requester_profile:profiles!requester_profile_id(
          id, first_name, last_name, avatar_url
        ),
        recipient_profile:profiles!recipient_profile_id(
          id, first_name, last_name, avatar_url
        )
      `)
      .eq('status', 'accepted')
      .is('stream_channel_id', null);

    if (connectionsError) {
      return NextResponse.json({ error: 'Failed to fetch connections' }, { status: 500 });
    }

    if (!connections || connections.length === 0) {
      return NextResponse.json({ 
        success: true, 
        message: 'No connections need Stream channels',
        count: 0
      });
    }

    console.log(`Found ${connections.length} connections without Stream channels`);

    // Check Stream environment variables
    if (!process.env.STREAM_KEY || !process.env.STREAM_SECRET) {
      return NextResponse.json({ 
        error: 'Stream Chat environment variables not set',
        details: 'STREAM_KEY and STREAM_SECRET are required'
      }, { status: 500 });
    }

    const streamClient = getServerStreamClient();
    const results = [];

    for (const connection of connections) {
      try {
        console.log(`Creating Stream channel for connection ${connection.id}`);
        
        const memberA = String(connection.requester_profile_id);
        const memberB = String(connection.recipient_profile_id);
        
        // Create/update user objects in Stream Chat
        const requesterProfile = connection.requester_profile as any;
        const recipientProfile = connection.recipient_profile as any;
        
        if (requesterProfile) {
          await streamClient.upsertUser({
            id: requesterProfile.id,
            name: `${requesterProfile.first_name} ${requesterProfile.last_name}`,
            image: requesterProfile.avatar_url,
          });
        }
        
        if (recipientProfile) {
          await streamClient.upsertUser({
            id: recipientProfile.id,
            name: `${recipientProfile.first_name} ${recipientProfile.last_name}`,
            image: recipientProfile.avatar_url,
          });
        }
        
        // Create a unique channel ID for this connection
        const channelId = `conn_${connection.id}`;
        
        // Create the Stream channel
        const channel = streamClient.channel('messaging', channelId, {
          created_by_id: memberA,
          members: [memberA, memberB],
        });
        
        await channel.create();
        console.log(`Stream channel created: ${channel.id}`);
        
        // Update connection with Stream channel ID
        const { error: saveError } = await supabase
          .from('connections')
          .update({ stream_channel_id: channel.id })
          .eq('id', connection.id);
        
        if (saveError) {
          console.error(`Failed to save Stream channel ID for connection ${connection.id}:`, saveError);
          results.push({ connectionId: connection.id, status: 'error', error: saveError.message });
        } else {
          console.log(`Stream channel ID saved for connection ${connection.id}`);
          results.push({ connectionId: connection.id, status: 'success', channelId: channel.id });
        }
        
      } catch (error) {
        console.error(`Error creating Stream channel for connection ${connection.id}:`, error);
        results.push({ 
          connectionId: connection.id, 
          status: 'error', 
          error: error instanceof Error ? error.message : 'Unknown error' 
        });
      }
    }

    const successCount = results.filter(r => r.status === 'success').length;
    const errorCount = results.filter(r => r.status === 'error').length;

    return NextResponse.json({ 
      success: true,
      message: `Processed ${connections.length} connections`,
      summary: {
        total: connections.length,
        successful: successCount,
        errors: errorCount
      },
      results
    });

  } catch (error) {
    console.error('Fix Stream channels error:', error);
    return NextResponse.json({ 
      error: 'Failed to fix Stream channels',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
