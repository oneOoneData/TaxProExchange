import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export const dynamic = 'force-dynamic';

/**
 * Fix events region field
 */
export async function POST() {
  try {
    const supabase = createServerClient();
    
    // Update events to have proper region based on location_state
    const { data: events, error: fetchError } = await supabase
      .from("events")
      .select("id, location_state");

    if (fetchError) {
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }

    let updated = 0;
    let errors = 0;

    for (const event of events || []) {
      const region = event.location_state || 'CA'; // Default to CA if no state
      
      const { error: updateError } = await supabase
        .from("events")
        .update({ region })
        .eq("id", event.id);

      if (updateError) {
        console.error(`Error updating event ${event.id}:`, updateError);
        errors++;
      } else {
        updated++;
      }
    }

    return NextResponse.json({
      success: true,
      updated,
      errors,
      message: `Updated ${updated} events with region data`
    });

  } catch (error) {
    console.error("Error fixing events region:", error);
    return NextResponse.json({ 
      error: "Internal server error" 
    }, { status: 500 });
  }
}
