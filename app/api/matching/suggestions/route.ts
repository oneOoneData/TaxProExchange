import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';
import { getSuggestedMatches } from '@/lib/db/matching';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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

    const matches = await getSuggestedMatches(profile.id);
    const isFirmAdmin = profile.profile_type === 'firm_admin';

    return NextResponse.json({
      matches,
      credits_remaining: isFirmAdmin ? 999 : (profile.connection_credits_remaining ?? 6),
      is_firm_admin: isFirmAdmin,
    });
  } catch (error) {
    console.error('Failed to fetch suggestions:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
