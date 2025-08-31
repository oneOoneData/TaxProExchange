import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { auth } from '@clerk/nextjs/server';

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({ error: 'Database configuration error' }, { status: 500 });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  // Get user's profile ID first
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id')
    .eq('user_id', userId)
    .single();

  if (profileError || !profile) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
  }

  // Get accepted connections where user is either requester or recipient
  const { data: connections, error } = await supabase
    .from('connections')
    .select(`
      id,
      status,
      requester_profile_id,
      recipient_profile_id,
      created_at,
      requester_profile:profiles!connections_requester_profile_id_fkey(
        first_name,
        last_name,
        firm_name
      ),
      recipient_profile:profiles!connections_recipient_profile_id_fkey(
        first_name,
        last_name,
        firm_name
      )
    `)
    .eq('status', 'accepted')
    .or(`requester_profile_id.eq.${profile.id},recipient_profile_id.eq.${profile.id}`);

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch connections' }, { status: 500 });
  }

  return NextResponse.json({ connections: connections || [] });
}
