import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export const dynamic = 'force-dynamic';

/**
 * Debug events with date filtering
 */
export async function GET() {
  try {
    const supabase = createServerClient();
    
    const now = new Date().toISOString();
    const futureDate = new Date(Date.now() + 180*24*60*60*1000).toISOString();
    
    console.log("Date range:", { now, futureDate });
    
    // Check publishable events without date filtering
    const { data: eventsNoDate, error: noDateError } = await supabase
      .from("events")
      .select("id,title,region,start_date,publishable")
      .eq("publishable", true);

    // Check with date filtering
    const { data: eventsWithDate, error: dateError } = await supabase
      .from("events")
      .select("id,title,region,start_date,publishable")
      .eq("publishable", true)
      .gte("start_date", now)
      .lte("start_date", futureDate);

    return NextResponse.json({
      dateRange: { now, futureDate },
      eventsNoDateFilter: eventsNoDate || [],
      eventsWithDateFilter: eventsWithDate || [],
      summary: {
        totalPublishable: eventsNoDate?.length || 0,
        publishableInDateRange: eventsWithDate?.length || 0
      }
    });

  } catch (error) {
    console.error("Error debugging events dates:", error);
    return NextResponse.json({ 
      error: "Internal server error" 
    }, { status: 500 });
  }
}
