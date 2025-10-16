// Admin endpoint to sync all profiles to HubSpot
// Requires admin authentication

import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseService } from '@/lib/supabaseService';
import { upsertHubSpotContact } from '@/lib/hubspot';

async function checkAdmin() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return { isAdmin: false, userId: null };
    }

    const supabase = supabaseService();
    
    // Check if user has admin role in the database
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('clerk_id', userId)
      .eq('is_admin', true)
      .single();

    return {
      isAdmin: !error && profile?.is_admin === true,
      userId
    };
  } catch (error) {
    console.error('Admin check error:', error);
    return { isAdmin: false, userId: null };
  }
}

export async function POST() {
  try {
    const { isAdmin } = await checkAdmin();
    
    if (!isAdmin) {
      return NextResponse.json(
        { ok: false, error: 'Unauthorized - Admin access required' },
        { status: 403 }
      );
    }

    const supabase = supabaseService();

    // Fetch all profiles with email addresses
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, public_email, email_preferences, created_at')
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
    const failures: Array<{ profileId: string; email: string; reason: string }> = [];

    console.log(`🔄 Starting HubSpot sync for ${profiles?.length || 0} profiles...`);

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
        if (okCount % 10 === 0) {
          console.log(`✅ Synced ${okCount} profiles so far...`);
        }
      } else {
        failCount++;
        failures.push({
          profileId: profile.id,
          email: profile.public_email,
          reason: result.reason || 'unknown',
        });
        console.error(`❌ Failed to sync ${profile.public_email}:`, result.reason);
      }

      // Rate limiting: small delay between requests
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log(`✅ HubSpot sync complete: ${okCount} synced, ${failCount} failed, ${skippedCount} skipped`);

    return NextResponse.json({
      ok: true,
      summary: {
        total: (profiles ?? []).length,
        synced: okCount,
        failed: failCount,
        skipped: skippedCount,
      },
      failures: failures.length > 0 ? failures.slice(0, 20) : undefined, // Return first 20 failures
    });
  } catch (error: any) {
    console.error('HubSpot sync error:', error);
    return NextResponse.json(
      { ok: false, error: error?.message ?? 'unknown_error' },
      { status: 500 }
    );
  }
}

