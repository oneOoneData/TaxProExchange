import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { acceptReferral } from '@/lib/db/referrals';

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { referral_id } = await request.json();
    if (!referral_id) return NextResponse.json({ error: 'Missing referral_id' }, { status: 400 });

    const result = await acceptReferral(referral_id);

    if (result.error) return NextResponse.json({ error: result.error }, { status: 500 });

    // TODO: Create Stripe Checkout session for the fee payment
    // Once Stripe Connect is set up, trigger payment flow here

    return NextResponse.json({ referral: result.data, message: 'Referral accepted. Payment link coming when Stripe Connect is configured.' });
  } catch (error) {
    console.error('Failed to accept referral:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
