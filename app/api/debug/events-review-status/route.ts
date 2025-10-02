import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = createServerClient();

    // Get all events with their review status
    const { data: events, error } = await supabase
      .from("events")
      .select(`
        id,
        title,
        review_status,
        created_at,
        candidate_url,
        link_health_score,
        publishable
      `)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching events:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Count by status
    const counts = {
      total: events?.length || 0,
      pending_review: events?.filter(e => e.review_status === 'pending_review').length || 0,
      approved: events?.filter(e => e.review_status === 'approved').length || 0,
      rejected: events?.filter(e => e.review_status === 'rejected').length || 0,
      null_status: events?.filter(e => e.review_status === null).length || 0,
      publishable: events?.filter(e => e.publishable === true).length || 0
    };

    return NextResponse.json({
      counts,
      events: events?.slice(0, 10) || [], // Show first 10 events
      message: "Debug info for events review status"
    });

  } catch (error) {
    console.error("Error in debug events review status:", error);
    return NextResponse.json({ 
      error: "Internal server error",
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
