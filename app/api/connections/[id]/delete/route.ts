import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: connectionId } = await params;
    if (!connectionId) {
      return NextResponse.json({ error: 'Connection ID required' }, { status: 400 });
    }

    // Get current user's profile ID
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('clerk_id', userId)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // Get the connection to verify the user is involved in it
    const { data: connection, error: connectionError } = await supabase
      .from('connections')
      .select('id, requester_profile_id, recipient_profile_id, stream_channel_id')
      .eq('id', connectionId)
      .single();

    if (connectionError || !connection) {
      return NextResponse.json({ error: 'Connection not found' }, { status: 404 });
    }

    // Verify the user is either the requester or recipient
    const isRequester = connection.requester_profile_id === profile.id;
    const isRecipient = connection.recipient_profile_id === profile.id;

    if (!isRequester && !isRecipient) {
      return NextResponse.json({ error: 'Not authorized to delete this connection' }, { status: 403 });
    }

    // Delete the Stream channel if it exists
    if (connection.stream_channel_id) {
      try {
        const streamResponse = await fetch(`${process.env.STREAM_API_URL}/channels/messaging/${connection.stream_channel_id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${process.env.STREAM_API_KEY}`,
            'Content-Type': 'application/json'
          }
        });

        if (!streamResponse.ok) {
          console.error('Failed to delete Stream channel:', await streamResponse.text());
          // Continue with connection deletion even if Stream deletion fails
        }
      } catch (streamError) {
        console.error('Error deleting Stream channel:', streamError);
        // Continue with connection deletion even if Stream deletion fails
      }
    }

    // Delete the connection from the database
    const { error: deleteError } = await supabase
      .from('connections')
      .delete()
      .eq('id', connectionId);

    if (deleteError) {
      console.error('Failed to delete connection:', deleteError);
      return NextResponse.json({ error: 'Failed to delete connection' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Connection deleted successfully' 
    });

  } catch (error) {
    console.error('Error deleting connection:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
