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
      .maybeSingle();

    if (!profile) {
      // Profile doesn't exist yet - return null preferences
      return NextResponse.json({ preferences: null });
    }

    // Get mentorship preferences
    const { data: prefs, error } = await supabase
      .from("mentorship_preferences")
      .select("*")
      .eq("profile_id", profile.id)
      .maybeSingle();

    if (error) {
      console.error("Error fetching mentorship preferences:", error);
      // Return null instead of error to prevent dashboard issues
      return NextResponse.json({ preferences: null });
    }

    return NextResponse.json({ preferences: prefs || null });

  } catch (error) {
    console.error("Error in mentorship preferences API:", error);
    // Return null instead of error to prevent dashboard issues
    return NextResponse.json({ preferences: null });
  }
}

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { is_open_to_mentor, is_seeking_mentor, topics, timezone } = body;

    const supabase = createServerClient();

    // Get current profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .eq("clerk_id", userId)
      .maybeSingle();

    if (!profile) {
      // Profile doesn't exist yet - return null
      return NextResponse.json({ preferences: null });
    }

    // Upsert mentorship preferences
    const { data, error } = await supabase
      .from("mentorship_preferences")
      .upsert({
        profile_id: profile.id,
        is_open_to_mentor: is_open_to_mentor || false,
        is_seeking_mentor: is_seeking_mentor || false,
        topics: topics || [],
        timezone: timezone || null
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

export async function PATCH(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { is_open_to_mentor, is_seeking_mentor, topics, timezone } = body;

    const supabase = createServerClient();

    // Get current profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .eq("clerk_id", userId)
      .maybeSingle();

    if (!profile) {
      // Profile doesn't exist yet - return null
      return NextResponse.json({ preferences: null });
    }

    // Get existing preferences
    const { data: existingPrefs } = await supabase
      .from("mentorship_preferences")
      .select("*")
      .eq("profile_id", profile.id)
      .maybeSingle();

    // Update mentorship preferences
    const updateData: any = {};
    if (is_open_to_mentor !== undefined) updateData.is_open_to_mentor = is_open_to_mentor;
    if (is_seeking_mentor !== undefined) updateData.is_seeking_mentor = is_seeking_mentor;
    if (topics !== undefined) updateData.topics = topics;
    if (timezone !== undefined) updateData.timezone = timezone;

    let data, error;
    
    if (existingPrefs) {
      // Update existing preferences
      const result = await supabase
        .from("mentorship_preferences")
        .update(updateData)
        .eq("profile_id", profile.id)
        .select()
        .single();
      data = result.data;
      error = result.error;
    } else {
      // Insert new preferences
      const result = await supabase
        .from("mentorship_preferences")
        .insert({
          profile_id: profile.id,
          is_open_to_mentor: is_open_to_mentor || false,
          is_seeking_mentor: is_seeking_mentor || false,
          topics: topics || [],
          timezone: timezone || null
        })
        .select()
        .single();
      data = result.data;
      error = result.error;
    }

    if (error) {
      console.error("Error updating mentorship preferences:", error);
      return NextResponse.json({ error: "Failed to update preferences" }, { status: 500 });
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
