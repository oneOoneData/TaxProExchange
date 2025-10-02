import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createServerClient } from "@/lib/supabase/server";
import { eventMatchesProfile } from "@/lib/events";

export const dynamic = 'force-dynamic';
export const revalidate = 60; // Cache for 1 minute

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const mode = searchParams.get("mode") ?? "curated"; // 'curated' | 'all'
    let region = searchParams.get("region") ?? "CA"; // Default fallback
    console.log("Events API called with mode:", mode, "region:", region);
    const supabase = createServerClient();

    // For curated mode, determine region from user profile if not explicitly provided
    let profile = null;
    if (mode === "curated") {
      const { userId } = await auth();
      if (!userId) return NextResponse.json({ events: [] });

      // Get user profile
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("id, clerk_id")
        .eq("clerk_id", userId)
        .single();

      if (profileError || !profileData) {
        console.error("Error fetching profile:", profileError);
        return NextResponse.json({ events: [] });
      }
      profile = profileData;

      // Determine region from user's profile locations if not explicitly provided
      if (!searchParams.get("region")) {
        const { data: locations } = await supabase
          .from("profile_locations")
          .select("state")
          .eq("profile_id", profile.id)
          .limit(1);
        
        if (locations && locations.length > 0 && locations[0].state) {
          region = locations[0].state;
          console.log("Determined region from user profile:", region);
        }
      }
    }

    // Check if review_status column exists first
    const { data: columnCheck } = await supabase
      .from("information_schema.columns")
      .select("column_name")
      .eq("table_name", "events")
      .eq("column_name", "review_status")
      .single();

    if (!columnCheck) {
      console.log("review_status column doesn't exist yet, returning no events until migration is applied");
      return NextResponse.json({ events: [] });
    }

    // fetch upcoming events (next 180 days) - ONLY admin-approved events
    const { data: events, error: eventsError } = await supabase
      .from("events")
      .select("id,title,description,start_date,end_date,location_city,location_state,canonical_url,candidate_url,link_health_score,last_checked_at,tags,organizer,source,region,review_status")
      .eq("review_status", "approved")  // Only show approved events
      .eq("region", region)
      .gte("start_date", new Date().toISOString())
      .lte("start_date", new Date(Date.now() + 180*24*60*60*1000).toISOString())
      .order("start_date", { ascending: true })
      .limit(200);

    if (eventsError) {
      console.error("Error fetching events:", eventsError);
      return NextResponse.json({ events: [], error: "Failed to fetch events" }, { status: 500 });
    }

    // Events are already filtered by review_status = "approved" in the query
    const filteredEvents = events ?? [];
    console.log(`Found ${filteredEvents.length} approved events for region ${region}`);

    // Transform events to include URL and link health info
    const transformedEvents = filteredEvents.map(event => ({
      id: event.id,
      title: event.title,
      description: event.description,
      start_date: event.start_date,
      end_date: event.end_date,
      location_city: event.location_city,
      location_state: event.location_state,
      url: event.canonical_url || event.candidate_url, // Use canonical URL if available
      tags: event.tags,
      organizer: event.organizer,
      source: event.source,
      link_health_score: event.link_health_score,
      last_checked_at: event.last_checked_at
    }));

    if (mode === "all") {
      return NextResponse.json({ events: transformedEvents });
    }

    // For curated mode, get full profile context for matching
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ events: [] });

    // If we don't already have the profile, fetch it
    if (!profile) {
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("id, clerk_id")
        .eq("clerk_id", userId)
        .single();

      if (profileError || !profileData) {
        console.error("Error fetching profile:", profileError);
        return NextResponse.json({ events: [] });
      }
      profile = profileData;
    }

    // Debug: Check if profile exists and get basic info
    console.log("Profile found:", { id: profile.id, clerk_id: profile.clerk_id });

    const [{ data: specs }, { data: soft }, { data: locs }] = await Promise.all([
      supabase.from("profile_specializations").select("specializations(label, slug)").eq("profile_id", profile.id),
      supabase.from("profile_software").select("software(slug)").eq("profile_id", profile.id),
      supabase.from("profile_locations").select("state").eq("profile_id", profile.id),
    ]);

    console.log("Raw query results:", { specs, soft, locs });

    const specialties = (specs ?? []).map((r:any)=> r.specializations?.slug).filter(Boolean);
    const softwareSlugs = (soft ?? []).map((r:any)=> r.software?.slug).filter(Boolean);
    const states = (locs ?? []).map((r:any)=> r.state).filter(Boolean);

    console.log("API Event curation debug:", {
      userId,
      specialties,
      softwareSlugs,
      states,
      totalEvents: events?.length || 0,
      rawLocs: locs,
      events: events?.map(e => ({ title: e.title, state: e.location_state, tags: e.tags })),
      profileId: profile.id
    });

    const curated = transformedEvents.filter(evt => eventMatchesProfile(evt as any, profile, specialties, softwareSlugs, states));
    console.log("Curated events count:", curated.length);
    console.log("Curated events details:", curated.map(e => ({ title: e.title, state: e.location_state, tags: e.tags, link_health_score: e.link_health_score })));
    return NextResponse.json({ events: curated });

  } catch (error) {
    console.error("Error in events API:", error);
    return NextResponse.json({ events: [], error: "Internal server error" }, { status: 500 });
  }
}
