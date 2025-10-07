import { auth } from "@clerk/nextjs/server";
import { createServerClient } from "@/lib/supabase/server";
import Link from "next/link";
import MentorshipPageClient from "./MentorshipPageClient";

export default async function MentorshipPage() {
  const { userId } = await auth();
  
  if (!userId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Sign In Required</h1>
          <p className="text-gray-600 mb-6">Please sign in to view mentorship opportunities.</p>
          <Link
            href="/sign-in"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  const supabase = createServerClient();

  // Get current profile and mentorship preferences
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, first_name, last_name, headline, bio, credential_type, ptin, website_url, linkedin_url, firm_name, phone, public_email, avatar_url, is_listed, visibility_state, accepting_work, slug, onboarding_complete, created_at, updated_at")
    .eq("clerk_id", userId)
    .single();

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Profile Required</h1>
          <p className="text-gray-600 mb-6">Please complete your profile to access mentorship features.</p>
          <Link
            href="/profile/edit"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            Complete Profile
          </Link>
        </div>
      </div>
    );
  }

  // Get mentorship matches directly from Supabase
  let matches: any[] = [];
  
  // Get current profile and mentorship preferences
  const { data: myPrefs } = await supabase
    .from("mentorship_preferences")
    .select("*")
    .eq("profile_id", profile.id)
    .maybeSingle();

  if (myPrefs && (myPrefs.is_open_to_mentor || myPrefs.is_seeking_mentor)) {
    // Use my topics + locations for matching
    const { data: myLocs } = await supabase
      .from("profile_locations")
      .select("location_id, locations(state, city)")
      .eq("profile_id", profile.id);

    const states = (myLocs ?? [])
      .map((r: any) => r.locations?.state)
      .filter(Boolean);

    // Base visibility filter
    const { data: candidates } = await supabase
      .from("profiles")
      .select(`
        id, first_name, last_name, headline, firm_name, credential_type,
        profile_locations:profile_locations(location_id),
        mentorship_preferences:mentorship_preferences(is_open_to_mentor, is_seeking_mentor, topics)
      `)
      .eq("is_listed", true)
      .eq("visibility_state", "verified")
      .neq("id", profile.id);

    // Filter candidates based on preferences
    matches = (candidates ?? []).filter((c: any) => {
      const prefs = c.mentorship_preferences?.[0];
      if (!prefs) return false;
      const topicOverlap = myPrefs?.topics?.some((t: string) => prefs.topics?.includes(t));
      const stateOverlap = states.length === 0 || (c.profile_locations ?? []).some((pl: any) => states.includes(pl.state));
      
      const wantMentors = !!myPrefs?.is_seeking_mentor;
      const wantMentees = !!myPrefs?.is_open_to_mentor;
      
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

    matches.sort((a: any, b: any) => score(b) - score(a));
  }

  // Fallback: Always fetch all mentors to show if matches are empty or few
  let allMentors: any[] = [];
  if (myPrefs && (myPrefs.is_open_to_mentor || myPrefs.is_seeking_mentor)) {
    // Fetch mentorship preferences directly
    const { data: mentorPrefs } = await supabase
      .from("mentorship_preferences")
      .select("profile_id, is_open_to_mentor, is_seeking_mentor, topics");

    // Filter for mentors if seeking, or mentees if open to mentor
    const wantMentors = !!myPrefs?.is_seeking_mentor;
    const wantMentees = !!myPrefs?.is_open_to_mentor;
    
    const relevantProfileIds = (mentorPrefs ?? [])
      .filter((mp: any) => {
        if (wantMentors && mp.is_open_to_mentor) return true;
        if (wantMentees && mp.is_seeking_mentor) return true;
        return false;
      })
      .map((mp: any) => mp.profile_id);

    if (relevantProfileIds.length > 0) {
      const { data: allCandidates } = await supabase
        .from("profiles")
        .select("id, first_name, last_name, headline, firm_name, credential_type, slug")
        .eq("is_listed", true)
        .eq("visibility_state", "verified")
        .in("id", relevantProfileIds)
        .neq("id", profile.id);

      // Combine profiles with their mentorship preferences
      allMentors = (allCandidates ?? []).map((c: any) => ({
        ...c,
        mentorship_preferences: mentorPrefs?.filter((mp: any) => mp.profile_id === c.id) || []
      }));
    }
  }

  return (
    <MentorshipPageClient 
      profile={profile}
      preferences={myPrefs}
      matches={matches}
      allMentors={allMentors}
    />
  );
}
