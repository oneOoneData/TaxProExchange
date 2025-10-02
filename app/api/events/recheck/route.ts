import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { runValidationBatch, validateEventById } from "@/lib/validateEvents";

export const dynamic = 'force-dynamic';

/**
 * Manual event recheck endpoint
 * Supports both batch validation and single event validation
 */
export async function POST(req: Request) {
  try {
    // Check authentication
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const eventId = searchParams.get("id");
    const batchSize = parseInt(searchParams.get("batch_size") || "50");

    // If specific event ID provided, validate just that event
    if (eventId) {
      console.log(`Manual recheck requested for event: ${eventId}`);
      
      const result = await validateEventById(eventId);
      
      if (result.success) {
        return NextResponse.json({
          success: true,
          eventId,
          score: result.score,
          publishable: result.publishable,
          message: `Event validated successfully with score ${result.score}`
        });
      } else {
        return NextResponse.json({
          success: false,
          eventId,
          error: result.error
        }, { status: 400 });
      }
    }

    // Otherwise run batch validation
    console.log(`Manual recheck batch requested with size: ${batchSize}`);
    
    const result = await runValidationBatch(batchSize);
    
    return NextResponse.json({
      success: true,
      processed: result.processed,
      validated: result.validated,
      publishable: result.publishable,
      errors: result.errors,
      message: `Validation complete: ${result.validated} validated, ${result.publishable} publishable`
    });

  } catch (error) {
    console.error("Error in manual recheck:", error);
    return NextResponse.json({ 
      error: "Internal server error",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}

/**
 * GET endpoint for checking validation status
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const eventId = searchParams.get("id");

    if (eventId) {
      // Return status for specific event
      const { createServerClient } = await import("@/lib/supabase/server");
      const supabase = createServerClient();
      
      const { data: event, error } = await supabase
        .from("events")
        .select("id,title,link_health_score,publishable,last_checked_at,url_status")
        .eq("id", eventId)
        .single();

      if (error || !event) {
        return NextResponse.json({ error: "Event not found" }, { status: 404 });
      }

      return NextResponse.json({
        eventId: event.id,
        title: event.title,
        linkHealthScore: event.link_health_score,
        publishable: event.publishable,
        lastChecked: event.last_checked_at,
        urlStatus: event.url_status
      });
    }

    // Return overall validation statistics
    const { createServerClient } = await import("@/lib/supabase/server");
    const supabase = createServerClient();
    
    const [
      { count: totalEvents },
      { count: publishableEvents },
      { count: unvalidatedEvents },
      { count: lowScoreEvents }
    ] = await Promise.all([
      supabase.from("events").select("*", { count: "exact", head: true }),
      supabase.from("events").select("*", { count: "exact", head: true }).eq("publishable", true),
      supabase.from("events").select("*", { count: "exact", head: true }).is("last_checked_at", null),
      supabase.from("events").select("*", { count: "exact", head: true }).lt("link_health_score", 70)
    ]);

    return NextResponse.json({
      totalEvents: totalEvents || 0,
      publishableEvents: publishableEvents || 0,
      unvalidatedEvents: unvalidatedEvents || 0,
      lowScoreEvents: lowScoreEvents || 0,
      validationRate: totalEvents ? ((publishableEvents || 0) / totalEvents * 100).toFixed(1) + "%" : "0%"
    });

  } catch (error) {
    console.error("Error in recheck status:", error);
    return NextResponse.json({ 
      error: "Internal server error" 
    }, { status: 500 });
  }
}
