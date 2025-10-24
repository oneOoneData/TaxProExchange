import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.warn('Supabase environment variables not configured');
}

const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!supabase) {
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 503 }
      );
    }

    const { id } = await params;

    // First, get the current profile to know what to match against
    const { data: currentProfile, error: profileError } = await supabase
      .from('profiles')
      .select('id, specializations, states, credential_type')
      .eq('id', id)
      .single();

    if (profileError || !currentProfile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      );
    }

    // Find related profiles using a scoring system
    // Priority: 1) Same specialization, 2) Same state, 3) Same credential
    const { data: allProfiles, error: searchError } = await supabase
      .from('profiles')
      .select(`
        id,
        slug,
        first_name,
        last_name,
        credential_type,
        headline,
        bio,
        avatar_url,
        specializations,
        states,
        firm_name
      `)
      .eq('is_listed', true)
      .eq('visibility_state', 'verified')
      .neq('id', id)
      .limit(50); // Get more candidates for better matching

    if (searchError || !allProfiles) {
      console.error('Error fetching related profiles:', searchError);
      return NextResponse.json({ relatedProfiles: [] });
    }

    // Score each profile based on similarity
    const scoredProfiles = allProfiles.map(profile => {
      let score = 0;
      
      // Check specialization overlap (highest priority)
      const currentSpecs = currentProfile.specializations || [];
      const profileSpecs = profile.specializations || [];
      const specOverlap = currentSpecs.filter((spec: string) => 
        profileSpecs.includes(spec)
      ).length;
      score += specOverlap * 10; // 10 points per matching specialization
      
      // Check state overlap (medium priority)
      const currentStates = currentProfile.states || [];
      const profileStates = profile.states || [];
      const stateOverlap = currentStates.filter((state: string) => 
        profileStates.includes(state)
      ).length;
      score += stateOverlap * 5; // 5 points per matching state
      
      // Check credential match (lower priority)
      if (profile.credential_type === currentProfile.credential_type) {
        score += 3; // 3 points for same credential
      }
      
      return {
        ...profile,
        matchScore: score
      };
    });

    // Sort by score and take top 3
    const topMatches = scoredProfiles
      .filter(p => p.matchScore > 0) // Only include profiles with some match
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, 3)
      .map(({ matchScore, ...profile }) => profile); // Remove score from response

    // If we don't have 3 matches, fill with random verified profiles
    if (topMatches.length < 3) {
      const needed = 3 - topMatches.length;
      const remainingIds = topMatches.map(p => p.id);
      
      const { data: randomProfiles } = await supabase
        .from('profiles')
        .select(`
          id,
          slug,
          first_name,
          last_name,
          credential_type,
          headline,
          bio,
          avatar_url,
          specializations,
          states,
          firm_name
        `)
        .eq('is_listed', true)
        .eq('visibility_state', 'verified')
        .neq('id', id)
        .not('id', 'in', `(${remainingIds.join(',')})`)
        .limit(needed);
      
      if (randomProfiles) {
        topMatches.push(...randomProfiles);
      }
    }

    return NextResponse.json({ 
      relatedProfiles: topMatches.slice(0, 3) // Ensure max 3
    });

  } catch (error) {
    console.error('Error in related profiles API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}


