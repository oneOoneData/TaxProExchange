import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { auth } from '@clerk/nextjs/server';

export async function GET(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const otherProfileId = searchParams.get('otherProfileId');
  
  if (!otherProfileId) return NextResponse.json({ error: 'Other profile ID required' }, { status: 400 });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({ error: 'Database configuration error' }, { status: 500 });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // Get current user's profile ID
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('clerk_id', userId)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // Check connection status using a simpler approach
    // First try to find connection where current user is requester
    let { data: connection } = await supabase
      .from('connections')
      .select('id, status, requester_profile_id')
      .eq('requester_profile_id', profile.id)
      .eq('recipient_profile_id', otherProfileId)
      .maybeSingle();

    // If not found, try where current user is recipient
    if (!connection) {
      const { data: recipientConnection } = await supabase
        .from('connections')
        .select('id, status, requester_profile_id')
        .eq('requester_profile_id', otherProfileId)
        .eq('recipient_profile_id', profile.id)
        .maybeSingle();
      
      connection = recipientConnection;
    }

    if (!connection) {
      return NextResponse.json({ status: 'none' });
    }

    // Determine if current user is the requester
    const isRequester = connection.requester_profile_id === profile.id;

    return NextResponse.json({
      status: connection.status,
      connectionId: connection.id,
      isRequester
    });

  } catch (error) {
    console.error('Connection status check error:', error);
    console.error('Error details:', {
      userId,
      otherProfileId,
      error: error instanceof Error ? error.message : String(error)
    });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
