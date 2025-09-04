import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function GET() {
  console.log('🔍 /api/connections/all: Route called');
  try {
    const { userId } = await auth();
    console.log('🔍 /api/connections/all: User ID:', userId);
    if (!userId) {
      console.log('❌ /api/connections/all: No user ID');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get current user's profile
    console.log('🔍 /api/connections/all: Looking up profile for clerk_id:', userId);
    const { data: currentProfile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('clerk_id', userId)
      .single();

    if (profileError || !currentProfile) {
      console.log('❌ /api/connections/all: Profile not found:', profileError);
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }
    
    console.log('✅ /api/connections/all: Found profile:', currentProfile.id);

    // Get all connections where the current user is either requester or recipient
    const { data: connections, error: connectionsError } = await supabase
      .from('connections')
      .select(`
        *,
        requester_profile:profiles!connections_requester_profile_id_fkey(
          id,
          first_name,
          last_name,
          headline,
          firm_name,
          public_email,
          avatar_url
        ),
        recipient_profile:profiles!connections_recipient_profile_id_fkey(
          id,
          first_name,
          last_name,
          headline,
          firm_name,
          public_email,
          avatar_url
        )
      `)
      .or(`requester_profile_id.eq.${currentProfile.id},recipient_profile_id.eq.${currentProfile.id}`)
      .order('created_at', { ascending: false });

    if (connectionsError) {
      console.error('Connections fetch error:', connectionsError);
      return NextResponse.json({ error: 'Failed to fetch connections' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      connections: connections || [],
      currentProfileId: currentProfile.id
    });

  } catch (error) {
    console.error('Connections fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
