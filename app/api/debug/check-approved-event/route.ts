import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = createServerClient();

    // Get the approved event with all details
    const { data: events, error } = await supabase
      .from("events")
      .select("*")
      .eq("review_status", "approved");

    if (error) {
      console.error("Error fetching approved events:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const now = new Date();
    const oneYearFromNow = new Date(Date.now() + 365*24*60*60*1000);

    return NextResponse.json({
      approvedEvents: events || [],
      dateInfo: {
        now: now.toISOString(),
        oneYearFromNow: oneYearFromNow.toISOString(),
        currentTimestamp: Date.now()
      },
      message: "Debug info for approved events"
    });

  } catch (error) {
    console.error("Error in debug approved events:", error);
    return NextResponse.json({ 
      error: "Internal server error",
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
