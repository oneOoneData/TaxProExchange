import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';
import { getServerStreamClient } from '@/lib/stream';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { decision } = await req.json();
    if (!decision || !['accepted', 'declined'].includes(decision)) {
      return NextResponse.json({ error: 'Invalid decision' }, { status: 400 });
    }

    const resolvedParams = await params;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get current user's profile
    const { data: currentProfile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('clerk_id', userId)
      .single();

    if (profileError || !currentProfile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // Get the connection and verify current user is the recipient
    const { data: connection, error: connectionError } = await supabase
      .from('connections')
      .select('*')
      .eq('id', resolvedParams.id)
      .eq('recipient_profile_id', currentProfile.id)
      .eq('status', 'pending')
      .single();

    if (connectionError || !connection) {
      return NextResponse.json({ error: 'Connection not found or unauthorized' }, { status: 404 });
    }

    // Update connection status
    const { data: updated, error: updateError } = await supabase
      .from('connections')
      .update({ status: decision })
      .eq('id', resolvedParams.id)
      .select()
      .single();

    if (updateError) {
      console.error('Connection update error:', updateError);
      return NextResponse.json({ error: 'Failed to update connection' }, { status: 500 });
    }

    // If declined, just return the updated connection
    if (decision === 'declined') {
      return NextResponse.json({ 
        success: true, 
        connection: updated 
      });
    }

    // If accepted, create Stream Chat channel
    if (decision === 'accepted' && !updated.stream_channel_id) {
      try {
        const streamClient = getServerStreamClient();
        
        // Create a unique channel ID for this connection
        const channelId = `conn_${updated.id}`;
        
        // Get both participant profile IDs
        const memberA = String(updated.requester_profile_id);
        const memberB = String(updated.recipient_profile_id);
        
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
          .eq('id', updated.id)
          .select()
          .single();
        
        if (saveError) {
          console.error('Failed to save Stream channel ID:', saveError);
          // Don't fail the whole request, just log the error
        } else {
          updated.stream_channel_id = channel.id;
        }
        
      } catch (streamError) {
        console.error('Stream Chat channel creation error:', streamError);
        // Don't fail the whole request, just log the error
      }
    }

    return NextResponse.json({ 
      success: true, 
      connection: updated 
    });

  } catch (error) {
    console.error('Connection decision error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
