import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = createServerClient();

    // Get all events with their review status (bypassing admin auth for debugging)
    const { data: events, error } = await supabase
      .from("events")
      .select(`
        id,
        title,
        description,
        start_date,
        end_date,
        location_city,
        location_state,
        candidate_url,
        canonical_url,
        url_status,
        link_health_score,
        last_checked_at,
        review_status,
        admin_notes,
        tags,
        organizer,
        reviewed_at,
        reviewed_by,
        created_at
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
      needs_edit: events?.filter(e => e.review_status === 'needs_edit').length || 0,
      null_status: events?.filter(e => e.review_status === null).length || 0
    };

    return NextResponse.json({
      events: events || [],
      counts,
      message: "Debug admin events review (no auth required)"
    });

  } catch (error) {
    console.error("Error in debug admin events review:", error);
    return NextResponse.json({ 
      error: "Internal server error",
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
