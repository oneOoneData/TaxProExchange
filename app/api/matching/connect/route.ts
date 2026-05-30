import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';
import { useConnectionCredit } from '@/lib/db/matching';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { suggested_profile_id } = await request.json();
    if (!suggested_profile_id) {
      return NextResponse.json({ error: 'Missing suggested_profile_id' }, { status: 400 });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get current user's profile
    let { data: profile } = await supabase
      .from('profiles')
      .select('id, connection_credits_remaining, profile_type')
      .eq('clerk_id', userId)
      .single();

    if (!profile) {
      const { data: profile2 } = await supabase
        .from('profiles')
        .select('id, connection_credits_remaining, profile_type')
        .eq('clerk_user_id', userId)
        .single();
      profile = profile2;
    }

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // Firm admins have unlimited credits
    const isFirmAdmin = profile.profile_type === 'firm_admin';

    // If not firm admin, use a credit
    let creditsRemaining = 999;
    if (!isFirmAdmin) {
      const result = await useConnectionCredit(profile.id);
      if (!result.success) {
        return NextResponse.json({ 
          error: 'No connection credits remaining',
          credits_remaining: 0,
          upgrade_url: '/for-firms'
        }, { status: 402 });
      }
      creditsRemaining = result.credits_remaining;
    }

    // Create the connection
    const { error: connectError } = await supabase
      .from('connections')
      .insert({
        requester_profile_id: profile.id,
        recipient_profile_id: suggested_profile_id,
        status: 'pending',
      });

    if (connectError) {
      // If already exists or duplicate, still ok
      console.error('Connection insert error:', connectError);
    }

    // Mark in match history
    await supabase
      .from('match_history')
      .update({ was_connected: true })
      .eq('viewer_profile_id', profile.id)
      .eq('suggested_profile_id', suggested_profile_id);

    return NextResponse.json({ 
      success: true, 
      credits_remaining: creditsRemaining,
      is_firm_admin: isFirmAdmin,
    });
  } catch (error) {
    console.error('Failed to connect:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
