import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createServerClient } from "@/lib/supabase/server";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const supabase = createServerClient();

    // Get current profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .eq("clerk_id", userId)
      .single();

    if (!profile) return NextResponse.json({ error: "Profile not found" }, { status: 404 });

    // Get profiles that recently enabled mentoring (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { data: newMentors, error } = await supabase
      .from("profiles")
      .select(`
        id, first_name, last_name, headline, firm_name, credential_type, slug, avatar_url, updated_at,
        mentorship_preferences!inner(is_open_to_mentor, topics, software, specializations, mentoring_message)
      `)
      .eq("is_listed", true)
      .eq("visibility_state", "verified")
      .eq("mentorship_preferences.is_open_to_mentor", true)
      .gte("mentorship_preferences.updated_at", sevenDaysAgo.toISOString())
      .neq("id", profile.id)
      .order("mentorship_preferences.updated_at", { ascending: false })
      .limit(10);

    if (error) {
      console.error("Error fetching new mentors:", error);
      return NextResponse.json({ error: "Failed to fetch new mentors" }, { status: 500 });
    }

    // Format the response
    const formattedMentors = (newMentors || []).map((mentor: any) => ({
      id: mentor.id,
      first_name: mentor.first_name,
      last_name: mentor.last_name,
      headline: mentor.headline,
      firm_name: mentor.firm_name,
      credential_type: mentor.credential_type,
      slug: mentor.slug,
      avatar_url: mentor.avatar_url,
      updated_at: mentor.mentorship_preferences?.[0]?.updated_at || mentor.updated_at,
      topics: mentor.mentorship_preferences?.[0]?.topics || [],
      software: mentor.mentorship_preferences?.[0]?.software || [],
      specializations: mentor.mentorship_preferences?.[0]?.specializations || [],
      mentoring_message: mentor.mentorship_preferences?.[0]?.mentoring_message
    }));

    return NextResponse.json({ newMentors: formattedMentors });

  } catch (error) {
    console.error("Error in new mentors API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
