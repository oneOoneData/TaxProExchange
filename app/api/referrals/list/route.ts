import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';
import { getUserReferrals } from '@/lib/db/referrals';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const supabase = createClient(supabaseUrl, supabaseKey);

    let { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('clerk_id', userId)
      .single();

    if (!profile) {
      const { data: p2 } = await supabase
        .from('profiles')
        .select('id')
        .eq('clerk_user_id', userId)
        .single();
      profile = p2;
    }

    if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 });

    const referrals = await getUserReferrals(profile.id);

    return NextResponse.json({ referrals });
  } catch (error) {
    console.error('Failed to list referrals:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
