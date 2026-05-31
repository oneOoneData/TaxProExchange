import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: Request) {
  const body = await req.text();
  const sig = req.headers.get('stripe-signature')!;

  let event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_PRACTICE_WEBHOOK_SECRET!);
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  const supabase = createServerClient();

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const clerkUserId = session.metadata?.clerk_user_id;
    if (!clerkUserId) return NextResponse.json({ error: 'No clerk_user_id' }, { status: 400 });

    // Get the profile ID from clerk_id
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('clerk_id', clerkUserId)
      .single();

    if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 });

    await supabase.from('practice_buyer_access').upsert({
      user_id: profile.id,
      stripe_subscription_id: session.subscription,
      stripe_customer_id: session.customer,
      access_start: new Date().toISOString(),
      access_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'active',
    }, { onConflict: 'user_id' });
  }

  if (event.type === 'customer.subscription.deleted') {
    const sub = event.data.object;
    await supabase
      .from('practice_buyer_access')
      .update({ status: 'expired' })
      .eq('stripe_subscription_id', sub.id);
  }

  return NextResponse.json({ received: true });
}
