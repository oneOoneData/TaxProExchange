import { NextResponse } from 'next/server';
import { getAppBaseUrl } from '@/lib/url';
import { auth } from '@clerk/nextjs/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  if (!process.env.STRIPE_PRACTICE_BUYER_PRICE_ID) {
    return NextResponse.json({ error: 'Stripe price not configured' }, { status: 500 });
  }

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [{
      price: process.env.STRIPE_PRACTICE_BUYER_PRICE_ID,
      quantity: 1,
    }],
    success_url: `${getAppBaseUrl()}/practices?unlocked=true`,
    cancel_url: `${getAppBaseUrl()}/practices`,
    metadata: { clerk_user_id: userId },
  });

  return NextResponse.json({ url: session.url });
}
