// API route to sync a single contact to HubSpot
// Called by settings page and onboarding flow

import { NextResponse } from 'next/server';
import { upsertHubSpotContact } from '@/lib/hubspot';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, first_name, last_name, marketing_opt_in } = body;

    if (!email) {
      return NextResponse.json(
        { ok: false, error: 'missing_email' },
        { status: 400 }
      );
    }

    // Sync to HubSpot
    const result = await upsertHubSpotContact({
      email,
      firstname: first_name,
      lastname: last_name,
      marketing_opt_in: marketing_opt_in ?? false,
    });

    if (!result.ok) {
      console.error('HubSpot sync failed:', result);
      return NextResponse.json(
        { ok: false, error: result.reason },
        { status: result.reason === 'not_configured' ? 200 : 500 }
      );
    }

    return NextResponse.json(
      { 
        ok: true, 
        operation: result.op,
        contactId: result.contactId 
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Sync contact error:', error);
    return NextResponse.json(
      { ok: false, error: error?.message ?? 'unknown_error' },
      { status: 500 }
    );
  }
}

