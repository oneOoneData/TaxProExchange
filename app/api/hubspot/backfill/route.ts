// One-time backfill route to sync all existing profiles to HubSpot
// Protected by CRON_SECRET - call with: Authorization: Bearer <CRON_SECRET>

import { NextResponse } from 'next/server';
import { supabaseService } from '@/lib/supabaseService';
import { upsertHubSpotContact } from '@/lib/hubspot';

export async function POST(req: Request) {
  try {
    // Verify authorization
    const authHeader = req.headers.get('authorization');
    const expectedAuth = `Bearer ${process.env.CRON_SECRET}`;
    
    if (!process.env.CRON_SECRET) {
      return NextResponse.json(
        { ok: false, error: 'cron_secret_not_configured' },
        { status: 500 }
      );
    }

    if (authHeader !== expectedAuth) {
      return NextResponse.json(
        { ok: false, error: 'unauthorized' },
        { status: 401 }
      );
    }

    const supabase = supabaseService();

    // Fetch all profiles with email addresses
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, public_email, email_preferences')
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Failed to fetch profiles:', error);
      return NextResponse.json(
        { ok: false, error: error.message },
        { status: 500 }
      );
    }

    let okCount = 0;
    let failCount = 0;
    let skippedCount = 0;
    const failures: Array<{ profileId: string; reason: string }> = [];

    // Process each profile
    for (const profile of profiles ?? []) {
      if (!profile.public_email) {
        skippedCount++;
        continue;
      }

      // Extract marketing_opt_in from email_preferences JSONB
      const emailPrefs = profile.email_preferences as any;
      const marketingOptIn = emailPrefs?.marketing_updates ?? false;

      const result = await upsertHubSpotContact({
        email: profile.public_email,
        firstname: profile.first_name,
        lastname: profile.last_name,
        marketing_opt_in: marketingOptIn,
      });

      if (result.ok) {
        okCount++;
      } else {
        failCount++;
        failures.push({
          profileId: profile.id,
          reason: result.reason || 'unknown',
        });
      }

      // Rate limiting: small delay between requests
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    return NextResponse.json({
      ok: true,
      summary: {
        total: (profiles ?? []).length,
        synced: okCount,
        failed: failCount,
        skipped: skippedCount,
      },
      failures: failures.length > 0 ? failures : undefined,
    });
  } catch (error: any) {
    console.error('Backfill error:', error);
    return NextResponse.json(
      { ok: false, error: error?.message ?? 'unknown_error' },
      { status: 500 }
    );
  }
}

