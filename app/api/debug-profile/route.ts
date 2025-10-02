import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createServerClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const supabase = createServerClient();

    // Get profile
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, clerk_id, first_name, last_name")
      .eq("clerk_id", userId)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    // Get all profile data
    const [
      { data: specs },
      { data: soft },
      { data: locs },
      { data: events }
    ] = await Promise.all([
      supabase.from("profile_specializations").select("specializations(label, slug)").eq("profile_id", profile.id),
      supabase.from("profile_software").select("software(slug)").eq("profile_id", profile.id),
      supabase.from("profile_locations").select("state").eq("profile_id", profile.id),
      supabase.from("events").select("*").gte("start_date", new Date().toISOString()).limit(5)
    ]);

    return NextResponse.json({
      profile: {
        id: profile.id,
        name: `${profile.first_name} ${profile.last_name}`,
        clerk_id: profile.clerk_id
      },
      specialties: (specs ?? []).map((r:any)=> r.specializations?.slug).filter(Boolean),
      software: (soft ?? []).map((r:any)=> r.software?.slug).filter(Boolean),
      states: (locs ?? []).map((r:any)=> r.state).filter(Boolean),
      eventsCount: events?.length || 0,
      rawData: { specs, soft, locs, events }
    });

  } catch (error) {
    console.error("Error in profile debug API:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
