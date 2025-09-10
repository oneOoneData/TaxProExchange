import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function GET(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const profileSlug = searchParams.get('profileSlug');

    if (!profileSlug) {
      return NextResponse.json({ error: 'Profile slug required' }, { status: 400 });
    }

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

    // Get target profile by slug
    const { data: targetProfile, error: targetError } = await supabase
      .from('profiles')
      .select('id')
      .eq('slug', profileSlug)
      .single();

    if (targetError || !targetProfile) {
      return NextResponse.json({ error: 'Target profile not found' }, { status: 404 });
    }

    // Check if connection exists
    const { data: connection, error: connectionError } = await supabase
      .from('connections')
      .select('id, status, requester_profile_id, recipient_profile_id')
      .or(`and(requester_profile_id.eq.${currentProfile.id},recipient_profile_id.eq.${targetProfile.id}),and(requester_profile_id.eq.${targetProfile.id},recipient_profile_id.eq.${currentProfile.id})`)
      .single();

    if (connectionError && connectionError.code !== 'PGRST116') {
      console.error('Connection check error:', connectionError);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    if (!connection) {
      return NextResponse.json({
        status: 'none',
        connectionId: null,
        isRequester: false
      });
    }

    return NextResponse.json({
      status: connection.status,
      connectionId: connection.id,
      isRequester: connection.requester_profile_id === currentProfile.id
    });

  } catch (error) {
    console.error('Connection check error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
