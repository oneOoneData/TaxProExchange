/**
 * API Route: Create Stripe Customer Portal Session
 * POST /api/stripe/customer-portal
 * 
 * Creates a Stripe Customer Portal session for subscription management
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createServerClient } from '@/lib/supabase/server';
import { createCustomerPortalSession } from '@/lib/stripe';

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

    // Get firm and verify user is a member
    const supabase = createServerClient();
    
    const { data: firm, error: firmError } = await supabase
      .from('firms')
      .select('id, name, stripe_customer_id')
      .eq('id', firmId)
      .single();

    if (firmError || !firm) {
      return NextResponse.json(
        { error: 'Firm not found' },
        { status: 404 }
      );
    }

    if (!firm.stripe_customer_id) {
      return NextResponse.json(
        { error: 'No Stripe customer found for this firm' },
        { status: 400 }
      );
    }

    // Verify user is a member of this firm
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
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
      .select('id, role')
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

    // Only admins can access billing
    if (membership.role !== 'admin') {
      return NextResponse.json(
        { error: 'Only firm admins can manage billing' },
        { status: 403 }
      );
    }

    // Create Customer Portal Session
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.SITE_URL || 'http://localhost:3000';
    const returnUrl = `${baseUrl}/team?firmId=${firmId}`;

    const session = await createCustomerPortalSession({
      customerId: firm.stripe_customer_id,
      returnUrl,
    });

    return NextResponse.json({ 
      url: session.url 
    });

  } catch (error: any) {
    console.error('Error creating customer portal session:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create customer portal session' },
      { status: 500 }
    );
  }
}

