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

    // Get user's profile ID
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('clerk_id', userId)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
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
