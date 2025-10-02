import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createServerClient } from "@/lib/supabase/server";

export const dynamic = 'force-dynamic';

// Helper function to verify admin status
async function verifyAdminStatus(): Promise<boolean> {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return false;
    }

    const supabase = createServerClient();

    // Check if user has admin role in the database
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('clerk_id', userId)
      .eq('is_admin', true)
      .single();

    return !error && profile?.is_admin === true;
  } catch (error) {
    console.error('Admin verification error:', error);
    return false;
  }
}

export async function POST() {
  try {
    // Check authentication
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check admin status
    const isAdmin = await verifyAdminStatus();
    if (!isAdmin) {
      return NextResponse.json({ error: "Forbidden - Admin access required" }, { status: 403 });
    }

    const supabase = createServerClient();

    // Get counts before clearing
    const [
      { count: eventsCount },
      { count: stagingCount },
      { count: tombstonesCount }
    ] = await Promise.all([
      supabase.from("events").select("*", { count: "exact", head: true }),
      supabase.from("staging_events").select("*", { count: "exact", head: true }),
      supabase.from("event_url_tombstones").select("*", { count: "exact", head: true })
    ]);

    // Clear all events tables
    const [eventsResult, stagingResult, tombstonesResult] = await Promise.all([
      supabase.from("events").delete().neq("id", "00000000-0000-0000-0000-000000000000"), // Delete all
      supabase.from("staging_events").delete().neq("id", "00000000-0000-0000-0000-000000000000"), // Delete all
      supabase.from("event_url_tombstones").delete().neq("id", "00000000-0000-0000-0000-000000000000") // Delete all
    ]);

    // Check for errors
    const errors = [];
    if (eventsResult.error) {
      console.error("Error clearing events:", eventsResult.error);
      errors.push(`Events: ${eventsResult.error.message}`);
    }
    if (stagingResult.error) {
      console.error("Error clearing staging events:", stagingResult.error);
      errors.push(`Staging: ${stagingResult.error.message}`);
    }
    if (tombstonesResult.error) {
      console.error("Error clearing tombstones:", tombstonesResult.error);
      errors.push(`Tombstones: ${tombstonesResult.error.message}`);
    }

    if (errors.length > 0) {
      return NextResponse.json({ 
        error: "Some tables could not be cleared", 
        details: errors 
      }, { status: 500 });
    }

    console.log(`Admin ${userId} cleared events: ${eventsCount} events, ${stagingCount} staging, ${tombstonesCount} tombstones`);

    return NextResponse.json({
      success: true,
      clearedCount: eventsCount || 0,
      stagingCleared: stagingCount || 0,
      tombstonesCleared: tombstonesCount || 0,
      message: "All events cleared successfully"
    });

  } catch (error) {
    console.error("Error in clear events API:", error);
    return NextResponse.json({ 
      error: "Internal server error",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}
