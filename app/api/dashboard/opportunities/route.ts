import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createServerClient } from "@/lib/supabase/server";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const supabase = createServerClient();
    console.log('🔍 Opportunities API: User ID:', userId);

    // Get current profile
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, credential_type, profile_locations(location_id, profile_locations_view(state, city)), profile_specializations(specialization_slug), profile_software(software_slug)")
      .eq("clerk_id", userId)
      .single();

    console.log('🔍 Opportunities API: Profile query result:', { profile, profileError });

    if (profileError) {
      console.error('🔍 Opportunities API: Profile query error:', profileError);
      return NextResponse.json({ error: "Database error: " + profileError.message }, { status: 500 });
    }

    if (!profile) return NextResponse.json({ error: "Profile not found" }, { status: 404 });

    // Get user's locations, specializations, and software
    const userStates = (profile.profile_locations || [])
      .map((pl: any) => pl.profile_locations_view?.state)
      .filter(Boolean);
    
    const userSpecializations = (profile.profile_specializations || [])
      .map((ps: any) => ps.specialization_slug)
      .filter(Boolean);
    
    const userSoftware = (profile.profile_software || [])
      .map((ps: any) => ps.software_slug)
      .filter(Boolean);

    // Build the query to find matching profiles - start with less restrictive criteria
    let query = supabase
      .from("profiles")
      .select(`
        id, first_name, last_name, headline, firm_name, credential_type, slug, avatar_url,
        profile_locations(location_id, profile_locations_view(state, city)),
        profile_specializations(specialization_slug),
        profile_software(software_slug)
      `)
      .neq("id", profile.id)
      .limit(50); // Increase limit to get more candidates

    // Only filter by visibility if we have verified profiles, otherwise be more inclusive
    const { data: verifiedCount } = await supabase
      .from("profiles")
      .select("id", { count: 'exact', head: true })
      .eq("visibility_state", "verified")
      .neq("id", profile.id);

    console.log('🔍 Opportunities API: Verified profiles count:', verifiedCount);

    if (verifiedCount && verifiedCount.length > 0) {
      // If we have verified profiles, use them
      query = query.eq("visibility_state", "verified");
    } else {
      // If no verified profiles, include pending and listed profiles
      query = query.in("visibility_state", ["verified", "pending_verification"])
                   .eq("is_listed", true);
    }

    // Execute the query
    const { data: candidates, error } = await query;

    console.log('🔍 Opportunities API: Candidates query result:', { candidates: candidates?.length, error });

    if (error) {
      console.error("🔍 Opportunities API: Error fetching candidates:", error);
      return NextResponse.json({ error: "Failed to fetch opportunities: " + error.message }, { status: 500 });
    }

    // Score and filter candidates based on matches
    const scoredCandidates = (candidates || []).map((candidate: any) => {
      const candidateStates = (candidate.profile_locations || [])
        .map((pl: any) => pl.profile_locations_view?.state)
        .filter(Boolean);
      
      const candidateSpecializations = (candidate.profile_specializations || [])
        .map((ps: any) => ps.specialization_slug)
        .filter(Boolean);
      
      const candidateSoftware = (candidate.profile_software || [])
        .map((ps: any) => ps.software_slug)
        .filter(Boolean);

      let score = 0;
      let reasons: string[] = [];

      // Location matching (state level)
      const stateMatch = userStates.length > 0 && candidateStates.some((state: string) => 
        userStates.includes(state)
      );
      if (stateMatch) {
        score += 30;
        reasons.push("Same state");
      }

      // Specialization matching
      const specializationMatches = userSpecializations.filter((spec: string) =>
        candidateSpecializations.includes(spec)
      );
      if (specializationMatches.length > 0) {
        score += specializationMatches.length * 20;
        reasons.push(`${specializationMatches.length} shared specialization${specializationMatches.length > 1 ? 's' : ''}`);
      }

      // Software matching
      const softwareMatches = userSoftware.filter((soft: string) =>
        candidateSoftware.includes(soft)
      );
      if (softwareMatches.length > 0) {
        score += softwareMatches.length * 15;
        reasons.push(`${softwareMatches.length} shared software`);
      }

      // Credential type matching
      if (candidate.credential_type === profile.credential_type) {
        score += 10;
        reasons.push("Same credential type");
      }

      // Always give some score to ensure we have results
      if (score === 0) {
        score = 10; // Increase base score
        reasons.push("Tax professional in your network");
      }

      // Give bonus points for having any profile data
      if (candidate.headline) score += 5;
      if (candidate.firm_name) score += 5;
      if (candidateStates.length > 0) score += 5;
      if (candidateSpecializations.length > 0) score += 5;

      return {
        ...candidate,
        score,
        reasons,
        location: candidateStates.join(", ") || "Location not specified",
        specialties: candidateSpecializations.slice(0, 3)
      };
    });

    // Sort by score and take top results
    let topMatches = scoredCandidates
      .sort((a, b) => b.score - a.score)
      .slice(0, 6);

    // If we still don't have enough matches, get any profiles as fallback
    if (topMatches.length === 0) {
      console.log('🔍 Opportunities API: No scored matches, getting fallback profiles');
      const { data: fallbackProfiles } = await supabase
        .from("profiles")
        .select("id, first_name, last_name, credential_type, slug, avatar_url")
        .neq("id", profile.id)
        .limit(6);

      topMatches = (fallbackProfiles || []).map((candidate: any) => ({
        ...candidate,
        score: 5,
        reasons: ["Tax professional"],
        location: "Location not specified",
        specialties: []
      }));
    }

    const formattedMatches = topMatches.map((candidate: any) => ({
      id: candidate.id,
      name: `${candidate.first_name} ${candidate.last_name}`,
      credential: candidate.credential_type,
      location: candidate.location,
      specialties: candidate.specialties,
      reason: candidate.reasons.join(", "),
      avatar: candidate.avatar_url,
      slug: candidate.slug
    }));

    console.log('🔍 Opportunities API: Final matches:', formattedMatches.length);

    return NextResponse.json({ opportunities: formattedMatches });

  } catch (error) {
    console.error("Error in opportunities API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
