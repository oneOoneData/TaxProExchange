import { NextResponse } from 'next/server';
import { upsertHubSpotContact } from '@/lib/hubspot';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json({ ok: false, error: 'missing_email' }, { status: 400 });
    }

    const result = await upsertHubSpotContact({
      email,
      properties: {
        ai_survey_submitted: true,
      },
    });

    if (!result.ok) {
      console.error('HubSpot survey sync failed:', result);

      return NextResponse.json(
        { ok: false, error: result.reason ?? 'hubspot_sync_failed' },
        { status: result.reason === 'not_configured' ? 200 : 500 },
      );
    }

    return NextResponse.json(
      {
        ok: true,
        operation: result.op,
        contactId: result.contactId,
      },
      { status: 200 },
    );
  } catch (error: any) {
    console.error('HubSpot survey sync exception:', error);
    return NextResponse.json(
      { ok: false, error: error?.message ?? 'unknown_error' },
      { status: 500 },
    );
  }
}


