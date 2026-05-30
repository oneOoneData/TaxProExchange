import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { declineReferral } from '@/lib/db/referrals';

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { referral_id } = await request.json();
    if (!referral_id) return NextResponse.json({ error: 'Missing referral_id' }, { status: 400 });

    const result = await declineReferral(referral_id);

    if (result.error) return NextResponse.json({ error: result.error }, { status: 500 });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to decline referral:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
