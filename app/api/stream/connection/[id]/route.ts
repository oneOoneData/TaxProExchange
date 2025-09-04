import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { auth } from '@clerk/nextjs/server';

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({ error: 'Database configuration error' }, { status: 500 });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);
  
  // Get connection details with profiles
  const { data: conn, error } = await supabase
    .from('connections')
    .select(`
      id, 
      status, 
      requester_profile_id, 
      recipient_profile_id, 
      stream_channel_id,
      requester_profile:profiles!requester_profile_id(
        id, first_name, last_name, headline, firm_name, public_email, avatar_url
      ),
      recipient_profile:profiles!recipient_profile_id(
        id, first_name, last_name, headline, firm_name, public_email, avatar_url
      )
    `)
    .eq('id', id)
    .single();

  if (error || !conn) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (conn.status !== 'accepted') return NextResponse.json({ error: 'Not accepted' }, { status: 403 });

  // Get user's profile ID to check authorization
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id')
    .eq('clerk_id', userId)
    .single();

  if (profileError || !profile) {
    console.error('Profile lookup failed:', { userId, profileError });
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
  }

  console.log('Connection access check:', {
    connectionId: id,
    userId,
    profileId: profile.id,
    requesterId: conn.requester_profile_id,
    recipientId: conn.recipient_profile_id
  });

  // Check if current user is a participant
  if (profile.id !== conn.requester_profile_id && profile.id !== conn.recipient_profile_id) {
    console.error('User not authorized for connection:', {
      profileId: profile.id,
      requesterId: conn.requester_profile_id,
      recipientId: conn.recipient_profile_id
    });
    return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
  }

  return NextResponse.json({ 
    connection: conn,
    currentProfileId: profile.id
  });
}
