import { NextResponse } from 'next/server';
import { createServerClient } from '../../lib/supabase/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST() {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [{
      price: process.env.STRIPE_PRACTICE_BUYER_PRICE_ID!,
      quantity: 1,
    }],
    success_url: `${process.env.NEXT_PUBLIC_URL}/practices?unlocked=true`,
    cancel_url: `${process.env.NEXT_PUBLIC_URL}/practices`,
    customer_email: user.email,
    metadata: { user_id: user.id },
  });

  return NextResponse.json({ url: session.url });
}
