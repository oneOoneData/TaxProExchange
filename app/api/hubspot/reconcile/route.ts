// Nightly reconciliation CRON job to sync recently updated profiles to HubSpot
// Catches any profiles that were updated while HubSpot was down or had issues
// Protected by CRON_SECRET - called by Vercel CRON

import { NextResponse } from 'next/server';
import { supabaseService } from '@/lib/supabaseService';
import { upsertHubSpotContact } from '@/lib/hubspot';

export async function POST(req: Request) {
  try {
    // Verify authorization (Vercel CRON sends Authorization header)
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

    // Fetch profiles updated in the last 24 hours
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, public_email, email_preferences, updated_at')
      .gte('updated_at', yesterday)
      .order('updated_at', { ascending: false });

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

    console.log('HubSpot reconciliation completed:', {
      total: (profiles ?? []).length,
      synced: okCount,
      failed: failCount,
      skipped: skippedCount,
    });

    return NextResponse.json({
      ok: true,
      summary: {
        total: (profiles ?? []).length,
        synced: okCount,
        failed: failCount,
        skipped: skippedCount,
        window: '24h',
      },
      failures: failures.length > 0 ? failures : undefined,
    });
  } catch (error: any) {
    console.error('Reconcile error:', error);
    return NextResponse.json(
      { ok: false, error: error?.message ?? 'unknown_error' },
      { status: 500 }
    );
  }
}

