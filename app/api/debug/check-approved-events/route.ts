import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { auth } from "@clerk/nextjs/server";

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createServerClient();

    // Check if user has admin role in the database
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('clerk_id', userId)
      .eq('is_admin', true)
      .single();

    if (profileError || !profile?.is_admin) {
      return NextResponse.json({ error: "Forbidden - Admin access required" }, { status: 403 });
    }

    // Get all approved events
    const { data: approvedEvents, error: approvedError } = await supabase
      .from('events')
      .select('id, title, review_status, start_date, location_state, region, link_health_score, last_checked_at')
      .eq('review_status', 'approved')
      .order('start_date', { ascending: true });

    if (approvedError) {
      console.error('Error fetching approved events:', approvedError);
      return NextResponse.json({ error: "Failed to fetch approved events", details: approvedError.message }, { status: 500 });
    }

    // Get all events (for comparison)
    const { data: allEvents, error: allError } = await supabase
      .from('events')
      .select('id, title, review_status, start_date, location_state, region, link_health_score, last_checked_at')
      .order('start_date', { ascending: true });

    if (allError) {
      console.error('Error fetching all events:', allError);
      return NextResponse.json({ error: "Failed to fetch all events", details: allError.message }, { status: 500 });
    }

    // Check current date for filtering
    const now = new Date();
    const futureDate = new Date(Date.now() + 365*24*60*60*1000);

    return NextResponse.json({
      currentDate: now.toISOString(),
      futureDate: futureDate.toISOString(),
      approvedEvents: approvedEvents || [],
      allEvents: allEvents || [],
      approvedCount: approvedEvents?.length || 0,
      totalCount: allEvents?.length || 0,
      debug: {
        approvedEventsInFuture: approvedEvents?.filter(e => e.start_date >= now.toISOString()).length || 0,
        approvedEventsInRange: approvedEvents?.filter(e => e.start_date >= now.toISOString() && e.start_date <= futureDate.toISOString()).length || 0
      }
    });

  } catch (error) {
    console.error('Error in debug approved events API:', error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
