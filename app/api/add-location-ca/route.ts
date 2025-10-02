import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createServerClient } from "@/lib/supabase/server";

export async function POST() {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const supabase = createServerClient();

    // Get profile
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id")
      .eq("clerk_id", userId)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    // Check if CA already exists
    const { data: existingCA } = await supabase
      .from("profile_locations")
      .select("id")
      .eq("profile_id", profile.id)
      .eq("state", "CA")
      .single();

    if (existingCA) {
      return NextResponse.json({ 
        success: true, 
        message: "California is already in your profile locations" 
      });
    }

    // Add California to profile locations
    const { error: insertError } = await supabase
      .from("profile_locations")
      .insert({
        profile_id: profile.id,
        state: "CA",
        city: "Encinitas"
      });

    if (insertError) {
      console.error("Error adding CA location:", insertError);
      return NextResponse.json({ error: "Failed to add location" }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: "Added California (Encinitas) to your profile locations" 
    });

  } catch (error) {
    console.error("Error in add-location API:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
