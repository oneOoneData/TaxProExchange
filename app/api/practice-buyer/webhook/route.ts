import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import Stripe from 'stripe';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

  let body: string;
  let sig: string;
  try {
    body = await req.text();
    sig = req.headers.get('stripe-signature')!;
  } catch {
    return NextResponse.json({ error: 'Failed to read request' }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_PRACTICE_WEBHOOK_SECRET!);
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  try {
    const supabase = createServerClient();

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      const clerkUserId = session.metadata?.clerk_user_id;
      if (!clerkUserId) return NextResponse.json({ error: 'No clerk_user_id' }, { status: 400 });

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
      const sub = event.data.object as Stripe.Subscription;
      await supabase
        .from('practice_buyer_access')
        .update({ status: 'expired' })
        .eq('stripe_subscription_id', sub.id);
    }
  } catch (err) {
    console.error('Webhook handler error:', err);
    // Still return 200 so Stripe doesn't keep retrying for handler-side bugs
    return NextResponse.json({ received: true, warning: 'Handler error logged' });
  }

  return NextResponse.json({ received: true });
}
