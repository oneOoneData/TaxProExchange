import { auth } from "@clerk/nextjs/server";
import { createServerClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  const { userId } = await auth();
  
  if (!userId) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const supabase = createServerClient();

  // Get profile
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("clerk_id", userId)
    .single();

  if (!profile) {
    return NextResponse.json({ 
      error: 'Profile not found',
      userId,
      profileError 
    }, { status: 404 });
  }

  // Get mentorship preferences
  const { data: myPrefs, error: prefsError } = await supabase
    .from("mentorship_preferences")
    .select("*")
    .eq("profile_id", profile.id)
    .maybeSingle();

  // Get all mentor candidates
  const { data: allCandidates, error: candidatesError } = await supabase
    .from("profiles")
    .select(`
      id, first_name, last_name, headline, firm_name, credential_type, slug,
      mentorship_preferences:mentorship_preferences(is_open_to_mentor, is_seeking_mentor, topics)
    `)
    .eq("is_listed", true)
    .eq("visibility_state", "verified")
    .neq("id", profile.id);

  // Filter mentors
  const allMentors = (allCandidates ?? []).filter((c: any) => {
    const prefs = c.mentorship_preferences?.[0];
    if (!prefs) return false;
    
    const wantMentors = !!myPrefs?.is_seeking_mentor;
    const wantMentees = !!myPrefs?.is_open_to_mentor;
    
    if (wantMentors && prefs.is_open_to_mentor) return true;
    if (wantMentees && prefs.is_seeking_mentor) return true;
    return false;
  });

  return NextResponse.json({
    userId,
    profile: {
      id: profile.id,
      name: `${profile.first_name} ${profile.last_name}`,
      is_listed: profile.is_listed,
      visibility_state: profile.visibility_state
    },
    myPrefs,
    prefsError,
    candidatesCount: allCandidates?.length || 0,
    candidatesError,
    mentorsCount: allMentors.length,
    mentors: allMentors.map((m: any) => ({
      id: m.id,
      name: `${m.first_name} ${m.last_name}`,
      has_prefs: !!m.mentorship_preferences?.[0],
      is_open_to_mentor: m.mentorship_preferences?.[0]?.is_open_to_mentor
    }))
  });
}

