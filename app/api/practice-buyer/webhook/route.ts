import { NextResponse } from 'next/server';
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

  const { createServerClient } = await import('@/lib/supabase/server');
  const supabase = createServerClient();

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const userId = session.metadata?.user_id;
    if (!userId) return NextResponse.json({ error: 'No user_id in metadata' }, { status: 400 });

    const { error } = await supabase
      .from('practice_buyer_access')
      .upsert({
        user_id: userId,
        stripe_subscription_id: session.subscription,
        stripe_customer_id: session.customer,
        access_start: new Date().toISOString(),
        access_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'active',
      }, { onConflict: 'user_id' });

    if (error) console.error('Failed to create buyer access:', error);
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
