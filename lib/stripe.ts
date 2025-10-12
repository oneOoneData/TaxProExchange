/**
 * Stripe Initialization and Utilities
 */

import Stripe from 'stripe';

// Lazy initialization to avoid build-time errors
let stripeInstance: Stripe | null = null;

function getStripe(): Stripe {
  if (!stripeInstance) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY is not set in environment variables');
    }
    stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-09-30.clover',
      typescript: true,
    });
  }
  return stripeInstance;
}

export const stripe = new Proxy({} as Stripe, {
  get: (target, prop) => {
    return (getStripe() as any)[prop];
  }
});

// Stripe configuration constants
export const STRIPE_CONFIG = {
  // Product IDs (create these in Stripe Dashboard)
  FIRM_WORKSPACE_PRICE_ID: process.env.STRIPE_FIRM_WORKSPACE_PRICE_ID || '',
  
  // Currency
  CURRENCY: 'usd',
  
  // Billing
  FIRM_WORKSPACE_AMOUNT: 1000, // $10.00 in cents
  
  // Trial period (optional - set to 0 for no trial)
  TRIAL_PERIOD_DAYS: 0,
} as const;

/**
 * Create a Stripe Checkout Session for firm subscription
 */
export async function createFirmCheckoutSession({
  firmId,
  firmName,
  customerEmail,
  successUrl,
  cancelUrl,
}: {
  firmId: string;
  firmName: string;
  customerEmail: string;
  successUrl: string;
  cancelUrl: string;
}): Promise<Stripe.Checkout.Session> {
  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    payment_method_types: ['card'], // Explicitly enable card payments
    customer_email: customerEmail,
    allow_promotion_codes: true, // Enable coupon/promo code field
    line_items: [
      {
        price: STRIPE_CONFIG.FIRM_WORKSPACE_PRICE_ID,
        quantity: 1,
      },
    ],
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: {
      firm_id: firmId,
      firm_name: firmName,
    },
    subscription_data: {
      metadata: {
        firm_id: firmId,
        firm_name: firmName,
      },
      // No trial - users can test the free platform first
      trial_period_days: STRIPE_CONFIG.TRIAL_PERIOD_DAYS > 0 ? STRIPE_CONFIG.TRIAL_PERIOD_DAYS : undefined,
    },
  });

  return session;
}

/**
 * Create a Stripe Customer Portal Session for subscription management
 */
export async function createCustomerPortalSession({
  customerId,
  returnUrl,
}: {
  customerId: string;
  returnUrl: string;
}): Promise<Stripe.BillingPortal.Session> {
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  });

  return session;
}

/**
 * Get subscription status by subscription ID
 */
export async function getSubscriptionStatus(
  subscriptionId: string
): Promise<{
  status: string;
  currentPeriodEnd: number;
  cancelAtPeriodEnd: boolean;
}> {
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const subData: any = subscription;
  
  return {
    status: subscription.status,
    currentPeriodEnd: subData.current_period_end,
    cancelAtPeriodEnd: subData.cancel_at_period_end,
  };
}

/**
 * Cancel a subscription at period end
 */
export async function cancelSubscription(subscriptionId: string): Promise<any> {
  return await stripe.subscriptions.update(subscriptionId, {
    cancel_at_period_end: true,
  } as any);
}

/**
 * Reactivate a canceled subscription
 */
export async function reactivateSubscription(subscriptionId: string): Promise<any> {
  return await stripe.subscriptions.update(subscriptionId, {
    cancel_at_period_end: false,
  } as any);
}

