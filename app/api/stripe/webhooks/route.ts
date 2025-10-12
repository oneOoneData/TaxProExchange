/**
 * API Route: Stripe Webhooks
 * POST /api/stripe/webhooks
 * 
 * Handles Stripe webhook events for subscription management
 */

import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import Stripe from 'stripe';
import { stripe } from '@/lib/stripe';
import { supabaseService } from '@/lib/supabaseService';

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const headersList = await headers();
    const signature = headersList.get('stripe-signature');

    if (!signature) {
      console.error('[Stripe Webhook] Missing signature');
      return NextResponse.json(
        { error: 'Missing stripe-signature header' },
        { status: 400 }
      );
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err: any) {
      console.error('[Stripe Webhook] Signature verification failed:', err.message);
      return NextResponse.json(
        { error: `Webhook signature verification failed: ${err.message}` },
        { status: 400 }
      );
    }

    console.log('[Stripe Webhook] Processing event:', event.type);

    const supabase = supabaseService();

    // Handle different event types
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutSessionCompleted(session, supabase);
        break;
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdate(subscription, supabase, event.id);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(subscription, supabase, event.id);
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaymentSucceeded(invoice, supabase, event.id);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaymentFailed(invoice, supabase, event.id);
        break;
      }

      default:
        console.log('[Stripe Webhook] Unhandled event type:', event.type);
    }

    return NextResponse.json({ received: true });

  } catch (error: any) {
    console.error('[Stripe Webhook] Error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}

/**
 * Handle checkout session completed
 */
async function handleCheckoutSessionCompleted(
  session: Stripe.Checkout.Session,
  supabase: any
) {
  const firmId = session.metadata?.firm_id;
  
  if (!firmId) {
    console.error('[Stripe Webhook] No firm_id in checkout session metadata');
    return;
  }

  const customerId = session.customer as string;
  const subscriptionId = session.subscription as string;

  // Update firm with Stripe customer and subscription IDs
  const { error } = await supabase
    .from('firms')
    .update({
      stripe_customer_id: customerId,
      stripe_subscription_id: subscriptionId,
      subscription_status: 'active',
      subscription_started_at: new Date().toISOString(),
    })
    .eq('id', firmId);

  if (error) {
    console.error('[Stripe Webhook] Error updating firm after checkout:', error);
  } else {
    console.log('[Stripe Webhook] Firm subscription activated:', firmId);
  }

  // Log event
  await supabase
    .from('firm_subscription_events')
    .insert({
      firm_id: firmId,
      event_type: 'checkout.completed',
      stripe_event_id: session.id,
      new_status: 'active',
      metadata: { customer_id: customerId, subscription_id: subscriptionId },
    });
}

/**
 * Handle subscription created/updated
 */
async function handleSubscriptionUpdate(
  subscription: Stripe.Subscription,
  supabase: any,
  eventId: string
) {
  const firmId = subscription.metadata?.firm_id;
  
  if (!firmId) {
    console.error('[Stripe Webhook] No firm_id in subscription metadata');
    return;
  }

  // Get current firm status
  const { data: firm } = await supabase
    .from('firms')
    .select('subscription_status')
    .eq('id', firmId)
    .single();

  const previousStatus = firm?.subscription_status || 'inactive';
  
  const subData: any = subscription;
  const updateData: any = {
    subscription_status: subscription.status,
    stripe_subscription_id: subscription.id,
    stripe_customer_id: subscription.customer as string,
  };
  
  if (subData.current_period_end) {
    updateData.subscription_current_period_end = new Date(subData.current_period_end * 1000).toISOString();
  }

  const { error } = await supabase
    .from('firms')
    .update(updateData)
    .eq('id', firmId);

  if (error) {
    console.error('[Stripe Webhook] Error updating subscription:', error);
  } else {
    console.log('[Stripe Webhook] Subscription updated:', firmId, subscription.status);
  }

  // Log event
  await supabase
    .from('firm_subscription_events')
    .insert({
      firm_id: firmId,
      event_type: 'subscription.updated',
      stripe_event_id: eventId,
      previous_status: previousStatus,
      new_status: subscription.status,
      metadata: { 
        subscription_id: subscription.id,
        current_period_end: subData.current_period_end 
      },
    });
}

/**
 * Handle subscription deleted
 */
async function handleSubscriptionDeleted(
  subscription: Stripe.Subscription,
  supabase: any,
  eventId: string
) {
  const firmId = subscription.metadata?.firm_id;
  
  if (!firmId) {
    console.error('[Stripe Webhook] No firm_id in subscription metadata');
    return;
  }

  const { data: firm } = await supabase
    .from('firms')
    .select('subscription_status')
    .eq('id', firmId)
    .single();

  const previousStatus = firm?.subscription_status || 'active';

  const { error } = await supabase
    .from('firms')
    .update({
      subscription_status: 'canceled',
    })
    .eq('id', firmId);

  if (error) {
    console.error('[Stripe Webhook] Error canceling subscription:', error);
  } else {
    console.log('[Stripe Webhook] Subscription canceled:', firmId);
  }

  // Log event
  await supabase
    .from('firm_subscription_events')
    .insert({
      firm_id: firmId,
      event_type: 'subscription.deleted',
      stripe_event_id: eventId,
      previous_status: previousStatus,
      new_status: 'canceled',
      metadata: { subscription_id: subscription.id },
    });
}

/**
 * Handle invoice payment succeeded
 */
async function handleInvoicePaymentSucceeded(
  invoice: Stripe.Invoice,
  supabase: any,
  eventId: string
) {
  const invoiceData: any = invoice;
  const subscriptionId = invoiceData.subscription as string;
  
  if (!subscriptionId) return;

  // Get subscription to find firm_id
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const firmId = subscription.metadata?.firm_id;

  if (!firmId) return;

  // Log event
  await supabase
    .from('firm_subscription_events')
    .insert({
      firm_id: firmId,
      event_type: 'payment.succeeded',
      stripe_event_id: eventId,
      metadata: { 
        invoice_id: invoice.id,
        amount: invoice.amount_paid,
      },
    });

  console.log('[Stripe Webhook] Payment succeeded for firm:', firmId);
}

/**
 * Handle invoice payment failed
 */
async function handleInvoicePaymentFailed(
  invoice: Stripe.Invoice,
  supabase: any,
  eventId: string
) {
  const invoiceData: any = invoice;
  const subscriptionId = invoiceData.subscription as string;
  
  if (!subscriptionId) return;

  // Get subscription to find firm_id
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const firmId = subscription.metadata?.firm_id;

  if (!firmId) return;

  // Update firm status to past_due
  await supabase
    .from('firms')
    .update({
      subscription_status: 'past_due',
    })
    .eq('id', firmId);

  // Log event
  await supabase
    .from('firm_subscription_events')
    .insert({
      firm_id: firmId,
      event_type: 'payment.failed',
      stripe_event_id: eventId,
      new_status: 'past_due',
      metadata: { 
        invoice_id: invoice.id,
        amount_due: invoice.amount_due,
      },
    });

  console.log('[Stripe Webhook] Payment failed for firm:', firmId);
}

