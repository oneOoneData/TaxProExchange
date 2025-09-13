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
        console.log('Creating Stream Chat channel for connection:', updated.id);
        
        // Check if Stream environment variables are set
        if (!process.env.STREAM_KEY || !process.env.STREAM_SECRET) {
          throw new Error('Stream Chat environment variables not set (STREAM_KEY, STREAM_SECRET)');
        }
        
        const streamClient = getServerStreamClient();
        console.log('Stream client created successfully');
        
        // Get both participant profile IDs
        const memberA = String(updated.requester_profile_id);
        const memberB = String(updated.recipient_profile_id);
        
        // Get profile information for both users
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id, first_name, last_name, avatar_url')
          .in('id', [memberA, memberB]);
        
        if (profilesError || !profiles || profiles.length !== 2) {
          throw new Error('Failed to fetch profile information for Stream users');
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
        const channelId = `conn_${updated.id}`;
        
        console.log('Creating channel with members:', { memberA, memberB, channelId });
        
        // Create the Stream channel
        const channel = streamClient.channel('messaging', channelId, {
          created_by_id: memberA,
          members: [memberA, memberB],
        });
        
        await channel.create();
        console.log('Stream channel created successfully:', channel.id);
        
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
          console.log('Stream channel ID saved to database:', channel.id);
          updated.stream_channel_id = channel.id;
        }
        
      } catch (streamError) {
        console.error('Stream Chat channel creation error:', streamError);
        console.error('Error details:', {
          message: streamError instanceof Error ? streamError.message : 'Unknown error',
          stack: streamError instanceof Error ? streamError.stack : undefined,
          envVars: {
            hasStreamKey: !!process.env.STREAM_KEY,
            hasStreamSecret: !!process.env.STREAM_SECRET,
            hasStreamAppId: !!process.env.STREAM_APP_ID
          },
          connectionId: updated.id
        });
        
        // Log a warning that the channel will need to be created manually
        console.warn(`Stream channel creation failed for connection ${updated.id}. Channel will be created automatically when user accesses messaging.`);
        
        // Don't fail the whole request, just log the error
        // The messaging page will automatically create the channel when needed
      }
    }

    // Send connection decision notification to requester
    try {
      // Get requester profile details for notification
      const { data: requesterProfile } = await supabase
        .from('profiles')
        .select('first_name, last_name, clerk_id')
        .eq('id', updated.requester_profile_id)
        .single();

      // Get responder profile details
      const { data: responderProfile } = await supabase
        .from('profiles')
        .select('first_name, last_name, firm_name')
        .eq('id', updated.recipient_profile_id)
        .single();

      if (requesterProfile && responderProfile) {
        await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/notify/connection-decision`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Webhook-Secret': process.env.WEBHOOK_SECRET || '',
          },
          body: JSON.stringify({
            connection_id: updated.id,
            decision: decision,
            responder_name: `${responderProfile.first_name} ${responderProfile.last_name}`,
            responder_firm: responderProfile.firm_name
          }),
        });
      }
    } catch (notificationError) {
      console.error('Failed to send connection decision notification:', notificationError);
      // Don't fail the connection decision if notification fails
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
