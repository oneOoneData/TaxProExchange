/**
 * API Route: Create Stripe Checkout Session for Firm Subscription
 * POST /api/stripe/create-checkout-session
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createServerClient } from '@/lib/supabase/server';
import { createFirmCheckoutSession } from '@/lib/stripe';

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { firmId } = body;

    if (!firmId) {
      return NextResponse.json(
        { error: 'Missing firmId' },
        { status: 400 }
      );
    }

    // Get firm details and verify user is a member
    const supabase = createServerClient();
    
    const { data: firm, error: firmError } = await supabase
      .from('firms')
      .select('id, name, subscription_status, stripe_customer_id')
      .eq('id', firmId)
      .single();

    if (firmError || !firm) {
      return NextResponse.json(
        { error: 'Firm not found' },
        { status: 404 }
      );
    }

    // Verify user is a member of this firm
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, public_email')
      .eq('clerk_user_id', userId)
      .single();

    if (!profile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      );
    }

    const { data: membership } = await supabase
      .from('firm_members')
      .select('id')
      .eq('firm_id', firmId)
      .eq('profile_id', profile.id)
      .eq('status', 'active')
      .single();

    if (!membership) {
      return NextResponse.json(
        { error: 'Not a member of this firm' },
        { status: 403 }
      );
    }

    // Check if firm already has an active subscription
    if (firm.subscription_status === 'active' || firm.subscription_status === 'trialing') {
      return NextResponse.json(
        { error: 'Firm already has an active subscription' },
        { status: 400 }
      );
    }

    // Create Stripe Checkout Session
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.SITE_URL || 'http://localhost:3000';
    const successUrl = `${baseUrl}/team?firmId=${firmId}&checkout=success`;
    const cancelUrl = `${baseUrl}/firm?firmId=${firmId}&checkout=canceled`;

    const session = await createFirmCheckoutSession({
      firmId: firm.id,
      firmName: firm.name,
      customerEmail: profile.public_email || '',
      successUrl,
      cancelUrl,
    });

    return NextResponse.json({ 
      sessionId: session.id,
      url: session.url 
    });

  } catch (error: any) {
    console.error('Error creating checkout session:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}

