"use client";
import { useEffect, useState } from "react";

export default function DashboardTopEventCard() {
  const [event, setEvent] = useState<any | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        console.log("DashboardTopEventCard: Fetching events...");
        const res = await fetch("/api/events?mode=curated", { 
          cache: "no-store",
          credentials: "include"
        });
        console.log("DashboardTopEventCard: Response status:", res.status);
        const data = await res.json();
        console.log("DashboardTopEventCard: Full response:", data);
        const { events } = data;
        console.log("DashboardTopEventCard: Events received:", events?.length || 0);
        console.log("DashboardTopEventCard: First event:", (events ?? [])[0]);
        const firstEvent = (events ?? [])[0];
        setEvent(firstEvent || null);
      } catch (error) {
        console.error("DashboardTopEventCard: Error fetching events:", error);
        setEvent(null);
      } finally {
        setLoaded(true);
      }
    })();
  }, []);

  if (!loaded) {
    return (
      <div className="rounded-2xl border p-4 bg-white shadow-sm">
        <div className="text-xs uppercase tracking-wide opacity-60">Loading Events...</div>
      </div>
    );
  }

  if (!event) {
    console.log("DashboardTopEventCard: No event to display, event:", event);
    return (
      <div className="rounded-2xl border p-4 bg-white shadow-sm">
        <div className="text-xs uppercase tracking-wide opacity-60">Upcoming Events</div>
        <h3 className="text-lg font-semibold mt-1">No upcoming events</h3>
        <div className="text-sm opacity-70 mt-1">Check back for community events and workshops.</div>
        <div className="mt-3">
          <a href="/events" className="text-sm underline">Browse Events</a>
        </div>
      </div>
    );
  }

  console.log("DashboardTopEventCard: Rendering event:", event);

  const dt = new Date(event.start_date);
  const when = dt.toLocaleDateString(undefined, { month:"short", day:"numeric", year:"numeric" });
  const where = event.location_state ? `${event.location_city ? event.location_city + ", " : ""}${event.location_state}` : "Virtual";

  return (
    <div className="rounded-2xl border p-4 bg-white shadow-sm">
      <div className="text-xs uppercase tracking-wide opacity-60">Top Event For You</div>
      <h3 className="text-lg font-semibold mt-1">{event.title}</h3>
      <div className="text-sm opacity-70">{when} • {where}</div>
      <div className="flex flex-wrap gap-2 mt-2">
        {(event.tags ?? []).slice(0,4).map((t:string)=>(<span key={t} className="px-2 py-0.5 rounded-full border text-xs">{t.replace("software_","")}</span>))}
      </div>
      <div className="flex items-center gap-3 mt-3">
        <a href={event.url} target="_blank" className="text-sm underline">View / Register</a>
        <a href="/events" className="text-sm underline opacity-80">See all curated events</a>
      </div>
    </div>
  );
}
