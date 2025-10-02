import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export const dynamic = 'force-dynamic';

/**
 * Debug events query
 */
export async function GET() {
  try {
    const supabase = createServerClient();
    
    // Check all publishable events regardless of region
    const { data: events, error } = await supabase
      .from("events")
      .select("id,title,region,location_state,publishable,link_health_score")
      .eq("publishable", true);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Also check events that should be publishable but aren't
    const { data: allEvents, error: allError } = await supabase
      .from("events")
      .select("id,title,region,location_state,publishable,link_health_score,url_status");

    return NextResponse.json({
      publishableEvents: events || [],
      allEvents: allEvents || [],
      summary: {
        totalPublishable: events?.length || 0,
        totalEvents: allEvents?.length || 0
      }
    });

  } catch (error) {
    console.error("Error debugging events:", error);
    return NextResponse.json({ 
      error: "Internal server error" 
    }, { status: 500 });
  }
}
