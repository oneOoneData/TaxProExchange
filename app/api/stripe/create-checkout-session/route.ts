/**
 * API Route: Create Stripe Checkout Session for Firm Subscription
 * POST /api/stripe/create-checkout-session
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
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
    const { firmId, profileId: profileIdFromBody } = body;

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

    // Resolve the caller's profile. Match on clerk_user_id OR clerk_id -- some rows only
    // have one set, and /api/firms accepts either. Looking up a single column here used
    // to 404 for those users, sending them back to re-submit the create form (=> duplicate
    // firms). profileId passed from the client is used only as a tie-breaker, and only if
    // that row is actually linked to (or unclaimed by) this Clerk user.
    let profile:
      | { id: string; public_email: string | null }
      | null = null;

    const { data: clerkMatches, error: clerkMatchError } = await supabase
      .from('profiles')
      .select('id, public_email, clerk_id, clerk_user_id')
      .or(`clerk_user_id.eq.${userId},clerk_id.eq.${userId}`)
      .limit(5);

    if (clerkMatchError) {
      console.error('create-checkout-session: profile lookup failed', clerkMatchError);
    }

    if (clerkMatches && clerkMatches.length > 0) {
      profile =
        (profileIdFromBody && clerkMatches.find((p) => p.id === profileIdFromBody)) ||
        clerkMatches[0];
    } else if (profileIdFromBody) {
      const { data } = await supabase
        .from('profiles')
        .select('id, public_email, clerk_id, clerk_user_id')
        .eq('id', profileIdFromBody)
        .maybeSingle();
      // Only accept it if this profile isn't claimed by a different Clerk user.
      if (
        data &&
        (!data.clerk_id || data.clerk_id === userId) &&
        (!data.clerk_user_id || data.clerk_user_id === userId)
      ) {
        profile = data;
      }
    }

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
      .maybeSingle();

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

    // Prefer the profile's public_email; fall back to the Clerk account email.
    // Passing '' to Stripe throws ("Invalid email address"), so send undefined
    // when we have nothing.
    let customerEmail = profile.public_email || undefined;
    if (!customerEmail) {
      const u = await currentUser();
      customerEmail = u?.emailAddresses?.[0]?.emailAddress || undefined;
    }

    const session = await createFirmCheckoutSession({
      firmId: firm.id,
      firmName: firm.name,
      customerEmail,
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

