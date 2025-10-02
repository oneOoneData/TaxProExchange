import { auth } from "@clerk/nextjs/server";
import { createServerClient } from "@/lib/supabase/server";
import { eventMatchesProfile } from "@/lib/events";
import EventCard from "@/components/EventCard";

async function fetchEvents(mode: "curated" | "all") {
  try {
    const supabase = createServerClient();

    // Check if review_status column exists first
    const { data: columnCheck } = await supabase
      .from("information_schema.columns")
      .select("column_name")
      .eq("table_name", "events")
      .eq("column_name", "review_status")
      .single();

    if (!columnCheck) {
      console.log("review_status column doesn't exist yet, returning no events until migration is applied");
      return [];
    }

    // fetch upcoming events (next 180 days) - ONLY approved events
    const { data: events, error: eventsError } = await supabase
      .from("events")
      .select("*")
      .eq("review_status", "approved")  // Only show approved events
      .gte("start_date", new Date().toISOString())
      .lte("start_date", new Date(Date.now() + 180*24*60*60*1000).toISOString())
      .order("start_date", { ascending: true });

    if (eventsError) {
      console.error("Error fetching events:", eventsError);
      return [];
    }

    console.log("Server-side events fetch:", {
      totalEvents: events?.length || 0,
      events: events?.map(e => ({ title: e.title, state: e.location_state, start_date: e.start_date }))
    });

    if (mode === "all") {
      return events ?? [];
    }

    const { userId } = await auth();
    if (!userId) return [];

    // pull profile context (states, specializations, software)
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, clerk_id")
      .eq("clerk_id", userId)
      .single();

    if (profileError || !profile) {
      console.error("Error fetching profile:", profileError);
      return [];
    }

    const [{ data: specs }, { data: soft }, { data: locs }] = await Promise.all([
      supabase.from("profile_specializations").select("specializations(label, slug)").eq("profile_id", profile.id),
      supabase.from("profile_software").select("software(slug)").eq("profile_id", profile.id),
      supabase.from("profile_locations").select("state").eq("profile_id", profile.id),
    ]);

    const specialties = (specs ?? []).map((r:any)=> r.specializations?.slug).filter(Boolean);
    const softwareSlugs = (soft ?? []).map((r:any)=> r.software?.slug).filter(Boolean);
    const states = (locs ?? []).map((r:any)=> r.state).filter(Boolean);

    console.log("Event curation debug:", {
      userId,
      specialties,
      softwareSlugs,
      states,
      totalEvents: events?.length || 0
    });

    const curated = (events ?? []).filter(evt => eventMatchesProfile(evt as any, profile, specialties, softwareSlugs, states));
    return curated;

  } catch (error) {
    console.error("Error in fetchEvents:", error);
    return [];
  }
}

export default async function EventsPage({ searchParams }:{ searchParams?: Promise<{ show?: string }> }) {
  const { userId } = await auth();
  const resolvedSearchParams = await searchParams;
  const showAll = resolvedSearchParams?.show === "all";
  const mode = showAll ? "all" : "curated";
  const events = await fetchEvents(mode);

  return (
    <div className="container-mobile py-8">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">Events</h1>
        <a href={`/events?show=${showAll ? "curated" : "all"}`} className="text-sm underline">
          {showAll ? "Show curated for me" : "Show all events"}
        </a>
      </div>
      {!showAll && (
        <div className="text-sm opacity-70 mt-1">
          <p>We curated this list for you based on your profile (location, specialties, and software).</p>
          <p className="mt-1">Events are shown if they match your service locations, specialties, or software preferences. Virtual events are always relevant.</p>
        </div>
      )}
      <div className="grid md:grid-cols-2 gap-4 mt-6">
        {(events ?? []).map((e:any) => <EventCard key={`${e.title}-${e.start_date}-${e.url}`} e={e} />)}
      </div>
      {(events ?? []).length === 0 && (
        <div className="mt-12 text-center text-sm opacity-70">
          No upcoming events found. Try "Show all events".
        </div>
      )}
    </div>
  );
}