import { auth } from "@clerk/nextjs/server";
import { createServerClient } from "@/lib/supabase/server";
import Link from "next/link";

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
    .select("id, first_name, last_name")
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

  const hasPreferences = myPrefs && (myPrefs.is_open_to_mentor || myPrefs.is_seeking_mentor);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Mentorship</h1>
          <p className="text-gray-600 mt-2">
            Connect with tax professionals for mentorship opportunities
          </p>
        </div>

        {/* Preferences Check */}
        {!hasPreferences && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">
                  Set up your mentorship preferences
                </h3>
                <div className="mt-2 text-sm text-blue-700">
                  <p>
                    To see mentorship matches, please update your profile to indicate whether you're open to mentoring others or seeking mentorship.
                  </p>
                </div>
                <div className="mt-4">
                  <Link
                    href="/profile/edit"
                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200"
                  >
                    Update Preferences
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Matches */}
        {hasPreferences && (
          <>
            {matches.length > 0 ? (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-900">
                  {myPrefs?.is_seeking_mentor && myPrefs?.is_open_to_mentor 
                    ? "Mentorship Opportunities" 
                    : myPrefs?.is_seeking_mentor 
                    ? "Potential Mentors" 
                    : "Potential Mentees"
                  }
                </h2>
                
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {matches.map((match: any) => (
                    <div key={match.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="text-lg font-medium text-gray-900">
                            {match.first_name} {match.last_name}
                          </h3>
                          {match.headline && (
                            <p className="text-sm text-gray-600 mt-1">{match.headline}</p>
                          )}
                          {match.firm_name && (
                            <p className="text-sm text-gray-500 mt-1">{match.firm_name}</p>
                          )}
                          <p className="text-sm text-gray-500 mt-1">
                            {match.credential_type}
                          </p>
                        </div>
                      </div>

                      {/* Topics */}
                      {match.mentorship_preferences?.[0]?.topics && (
                        <div className="mt-4">
                          <div className="flex flex-wrap gap-1">
                            {match.mentorship_preferences[0].topics.slice(0, 4).map((topic: string) => (
                              <span
                                key={topic}
                                className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                              >
                                {topic.replace("software_", "").replace(/_/g, " ").toUpperCase()}
                              </span>
                            ))}
                            {match.mentorship_preferences[0].topics.length > 4 && (
                              <span className="text-xs text-gray-500">
                                +{match.mentorship_preferences[0].topics.length - 4} more
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Location */}
                      {match.profile_locations && match.profile_locations.length > 0 && (
                        <div className="mt-4">
                          <p className="text-sm text-gray-600">
                            {match.profile_locations
                              .map((pl: any) => pl.locations?.state)
                              .filter(Boolean)
                              .join(", ")
                            }
                          </p>
                        </div>
                      )}

                      {/* Connect Button */}
                      <div className="mt-6">
                        <Link
                          href={`/p/${match.slug || match.id}`}
                          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                        >
                          View Profile & Connect
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="mx-auto h-12 w-12 text-gray-400">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                  </svg>
                </div>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No matches found</h3>
                <p className="mt-1 text-sm text-gray-500">
                  We couldn't find any mentorship matches based on your preferences. Try updating your topics or locations.
                </p>
                <div className="mt-6">
                  <Link
                    href="/profile/edit"
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                  >
                    Update Preferences
                  </Link>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
