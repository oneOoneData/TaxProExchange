import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's profile ID - try both clerk_id and clerk_user_id
    let { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('clerk_id', userId)
      .single();

    // If not found with clerk_id, try clerk_user_id
    if (profileError && profileError.code === 'PGRST116') {
      const { data: profile2, error: profileError2 } = await supabase
        .from('profiles')
        .select('id')
        .eq('clerk_user_id', userId)
        .single();
      
      if (!profileError2) {
        profile = profile2;
        profileError = null;
      }
    }

    if (profileError || !profile) {
      console.log('🔍 Pending connections API: Profile not found for userId:', userId, 'error:', profileError);
      return NextResponse.json({ count: 0, hasPending: false });
    }

    // Get pending connection requests where user is the recipient
    const { data: pendingConnections, error: connectionsError } = await supabase
      .from('connections')
      .select('id')
      .eq('recipient_profile_id', profile.id)
      .eq('status', 'pending');

    if (connectionsError) {
      console.error('Failed to fetch pending connections:', connectionsError);
      return NextResponse.json({ error: 'Failed to fetch pending connections' }, { status: 500 });
    }

    const count = pendingConnections?.length || 0;

    return NextResponse.json({ 
      count,
      hasPending: count > 0
    });

  } catch (error) {
    console.error('Error checking pending connections:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
