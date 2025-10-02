import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createServerClient } from "@/lib/supabase/server";

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const supabase = createServerClient();

    // fetch current profile + prefs
    const { data: profile } = await supabase
      .from("profiles")
      .select("id, visibility_state, is_listed, credential_type")
      .eq("clerk_id", userId)
      .single();

    if (!profile) return NextResponse.json({ matches: [] });

    const { data: myPrefs } = await supabase
      .from("mentorship_preferences")
      .select("*")
      .eq("profile_id", profile.id)
      .maybeSingle();

    // Use my topics + locations for matching
    const { data: myLocs } = await supabase
      .from("profile_locations")
      .select("location_id, locations(state, city)")
      .eq("profile_id", profile.id);

    const states = (myLocs ?? [])
      .map((r: any) => r.locations?.state)
      .filter(Boolean);

    // Base visibility filter
    const base = supabase
      .from("profiles")
      .select(`
        id, first_name, last_name, headline, firm_name, credential_type,
        profile_locations:profile_locations(location_id),
        mentorship_preferences:mentorship_preferences(is_open_to_mentor, is_seeking_mentor, topics)
      `)
      .eq("is_listed", true)
      .eq("visibility_state", "verified")
      .neq("id", profile.id);

    // If seeking -> find mentors; if mentoring -> find seekers; if both -> prefer mentors first
    const wantMentors = !!myPrefs?.is_seeking_mentor;
    const wantMentees = !!myPrefs?.is_open_to_mentor;

    let { data: candidates } = await base;

    candidates = (candidates ?? []).filter((c: any) => {
      const prefs = c.mentorship_preferences?.[0];
      if (!prefs) return false;
      const topicOverlap = myPrefs?.topics?.some((t: string) => prefs.topics?.includes(t));
      const stateOverlap = states.length === 0 || (c.profile_locations ?? []).some((pl: any) => states.includes(pl.state));
      if (wantMentors && prefs.is_open_to_mentor && topicOverlap && stateOverlap) return true;
      if (wantMentees && prefs.is_seeking_mentor && topicOverlap && stateOverlap) return true;
      return false;
    });

    // Simple rank: same-state + topic overlap count
    const score = (c: any) => {
      const prefs = c.mentorship_preferences?.[0] ?? {};
      const overlap = (myPrefs?.topics ?? []).filter((t: string) => (prefs.topics ?? []).includes(t)).length;
      const inState = (c.profile_locations ?? []).some((pl: any) => states.includes(pl.state));
      return overlap * 10 + (inState ? 5 : 0);
    };

    candidates.sort((a: any, b: any) => score(b) - score(a));

    return NextResponse.json({ matches: candidates });

  } catch (error) {
    console.error("Error in mentorship API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
