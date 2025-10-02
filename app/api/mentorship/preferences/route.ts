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

    // Get mentorship preferences
    const { data: prefs, error } = await supabase
      .from("mentorship_preferences")
      .select("*")
      .eq("profile_id", profile.id)
      .maybeSingle();

    if (error) {
      console.error("Error fetching mentorship preferences:", error);
      return NextResponse.json({ error: "Failed to fetch preferences" }, { status: 500 });
    }

    return NextResponse.json({ preferences: prefs || null });

  } catch (error) {
    console.error("Error in mentorship preferences API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { is_open_to_mentor, is_seeking_mentor, topics } = body;

    const supabase = createServerClient();

    // Get current profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .eq("clerk_id", userId)
      .single();

    if (!profile) return NextResponse.json({ error: "Profile not found" }, { status: 404 });

    // Upsert mentorship preferences
    const { data, error } = await supabase
      .from("mentorship_preferences")
      .upsert({
        profile_id: profile.id,
        is_open_to_mentor: is_open_to_mentor || false,
        is_seeking_mentor: is_seeking_mentor || false,
        topics: topics || []
      })
      .select()
      .single();

    if (error) {
      console.error("Error saving mentorship preferences:", error);
      return NextResponse.json({ error: "Failed to save preferences" }, { status: 500 });
    }

    return NextResponse.json({ preferences: data });

  } catch (error) {
    console.error("Error in mentorship preferences API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
