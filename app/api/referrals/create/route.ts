import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';
import { createReferral } from '@/lib/db/referrals';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get profile
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

    const { recipient_id, client_name, client_info, fee_amount, message } = await request.json();

    if (!recipient_id || !client_name || !fee_amount) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (fee_amount < 100) {
      return NextResponse.json({ error: 'Minimum fee is $1.00' }, { status: 400 });
    }

    const result = await createReferral({
      referrer_id: profile.id,
      recipient_id,
      client_name,
      client_info,
      fee_amount,
      message,
    });

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({ referral: result.data }, { status: 201 });
  } catch (error) {
    console.error('Failed to create referral:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
