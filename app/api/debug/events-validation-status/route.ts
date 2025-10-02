import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = createServerClient();
    
    // Get events with their validation status
    const { data: events, error } = await supabase
      .from("events")
      .select("id,title,candidate_url,link_health_score,publishable,url_status,last_checked_at")
      .order("created_at", { ascending: false })
      .limit(10);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      events: events || [],
      summary: {
        total: events?.length || 0,
        publishable: events?.filter(e => e.publishable).length || 0,
        averageScore: events?.length ? 
          Math.round(events.reduce((sum, e) => sum + (e.link_health_score || 0), 0) / events.length) : 0
      }
    });

  } catch (error) {
    console.error("Error checking validation status:", error);
    return NextResponse.json({ 
      error: "Internal server error" 
    }, { status: 500 });
  }
}
