import { supabaseService } from '@/lib/supabaseService';

export interface MatchConfig {
  id: number;
  rules: MatchRule[];
  min_score: number;
  max_suggestions: number;
  free_credits: number;
  rotation_days: number;
}

export interface MatchRule {
  signal: string;
  weight: number;
  enabled: boolean;
}

export interface SuggestedMatch {
  profile_id: string;
  first_name: string;
  last_name: string;
  headline?: string;
  credential_type: string;
  slug: string;
  avatar_url?: string;
  firm_name?: string;
  primary_location?: any;
  specializations?: string[];
  match_score: number;
  score_breakdown: { signal: string; points: number }[];
}

/**
 * Load the match config (rule weights, thresholds)
 */
export async function getMatchConfig(): Promise<MatchConfig | null> {
  const supabase = supabaseService();
  const { data, error } = await supabase
    .from('match_config')
    .select('*')
    .eq('id', 1)
    .single();
  
  if (error || !data) return null;
  return data as MatchConfig;
}

/**
 * Update match config (for Koen to tweak)
 */
export async function updateMatchConfig(config: Partial<MatchConfig>): Promise<boolean> {
  const supabase = supabaseService();
  const { error } = await supabase
    .from('match_config')
    .update({ ...config, updated_at: new Date().toISOString() })
    .eq('id', 1);
  
  return !error;
}

/**
 * Get suggested matches for a profile
 */
export async function getSuggestedMatches(profileId: string): Promise<SuggestedMatch[]> {
  const supabase = supabaseService();
  const config = await getMatchConfig();
  if (!config) return [];

  const enabledRules = config.rules.filter(r => r.enabled);
  if (enabledRules.length === 0) return [];

  // 1. Get the viewing profile
  const { data: viewer } = await supabase
    .from('profiles')
    .select('id, primary_location, specializations, credential_type, works_multistate, works_international, years_experience, firm_name')
    .eq('id', profileId)
    .single();

  if (!viewer) return [];

  // 2. Get candidates who opted in, are accepting work, and haven't been shown recently
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - config.rotation_days);

  const { data: shownIds } = await supabase
    .from('match_history')
    .select('suggested_profile_id')
    .eq('viewer_profile_id', profileId)
    .gte('created_at', thirtyDaysAgo.toISOString());

  const excludeIds = [profileId, ...(shownIds?.map(s => s.suggested_profile_id) || [])];

  const { data: candidates } = await supabase
    .from('profiles')
    .select('id, first_name, last_name, headline, credential_type, slug, avatar_url, firm_name, primary_location, specializations, years_experience, works_multistate, works_international, accepting_work')
    .eq('allow_matching', true)
    .eq('accepting_work', true)
    .not('id', 'in', `(${excludeIds.join(',')})`)
    .limit(50);

  if (!candidates || candidates.length === 0) return [];

  const viewerLocation = viewer.primary_location as any || {};
  const viewerSpecializations: string[] = viewer.specializations || [];
  const viewerCity = viewerLocation?.city?.toLowerCase();
  const viewerState = viewerLocation?.state?.toLowerCase();

  // 3. Score each candidate
  const scored: SuggestedMatch[] = candidates.map(candidate => {
    const candidateLocation = (candidate.primary_location as any) || {};
    const candidateSpecs: string[] = candidate.specializations || [];
    const breakdown: { signal: string; points: number }[] = [];
    let totalScore = 0;

    // Same city
    const cityRule = enabledRules.find(r => r.signal === 'same_city');
    if (cityRule) {
      const candCity = candidateLocation?.city?.toLowerCase();
      if (viewerCity && candCity && viewerCity === candCity) {
        breakdown.push({ signal: 'same_city', points: cityRule.weight });
        totalScore += cityRule.weight;
      }
    }

    // Same state
    const stateRule = enabledRules.find(r => r.signal === 'same_state');
    if (stateRule) {
      const candState = candidateLocation?.state?.toLowerCase();
      if (viewerState && candState && viewerState === candState) {
        breakdown.push({ signal: 'same_state', points: stateRule.weight });
        totalScore += stateRule.weight;
      }
    }

    // Remote OK — if viewer works multistate/international, match anyone
    const remoteRule = enabledRules.find(r => r.signal === 'remote_ok');
    if (remoteRule) {
      if (viewer.works_multistate || viewer.works_international || candidate.works_multistate || candidate.works_international) {
        breakdown.push({ signal: 'remote_ok', points: remoteRule.weight });
        totalScore += remoteRule.weight;
      }
    }

    // Complementary skills — opposite specializations score higher
    const skillRule = enabledRules.find(r => r.signal === 'complementary_skill');
    if (skillRule && viewerSpecializations.length > 0 && candidateSpecs.length > 0) {
      // Score based on shared vs different specializations
      const shared = viewerSpecializations.filter(s => candidateSpecs.includes(s));
      const different = viewerSpecializations.filter(s => !candidateSpecs.includes(s));
      
      // More shared = less complementary (for firms needing diverse skills)
      // Actually: if viewer has specs A,B and candidate has A,C → they share A → complementary on C
      if (shared.length < candidateSpecs.length) {
        // They complement each other
        const score = Math.min(skillRule.weight, Math.round(skillRule.weight * (different.length / Math.max(viewerSpecializations.length, 1))));
        breakdown.push({ signal: 'complementary_skill', points: score });
        totalScore += score;
      }
    }

    // Niche scarcity — boost for rare specializations
    const nicheRule = enabledRules.find(r => r.signal === 'niche_scarcity');
    if (nicheRule && candidateSpecs.length > 0) {
      // We already have the candidate — check if their specs are rare
      // (simplified: fewer specs = more niche = higher score)
      if (candidateSpecs.length <= 2) {
        breakdown.push({ signal: 'niche_scarcity', points: nicheRule.weight });
        totalScore += nicheRule.weight;
      }
    }

    // Same experience level
    const expRule = enabledRules.find(r => r.signal === 'same_experience_level');
    if (expRule && viewer.years_experience && candidate.years_experience && viewer.years_experience === candidate.years_experience) {
      breakdown.push({ signal: 'same_experience_level', points: expRule.weight });
      totalScore += expRule.weight;
    }

    return {
      profile_id: candidate.id,
      first_name: candidate.first_name,
      last_name: candidate.last_name,
      headline: candidate.headline,
      credential_type: candidate.credential_type,
      slug: candidate.slug,
      avatar_url: candidate.avatar_url,
      firm_name: candidate.firm_name,
      primary_location: candidate.primary_location,
      specializations: candidate.specializations,
      match_score: totalScore,
      score_breakdown: breakdown,
    };
  });

  // 4. Filter by min score, sort by score desc, limit
  const filtered = scored
    .filter(m => m.match_score >= config.min_score)
    .sort((a, b) => b.match_score - a.match_score)
    .slice(0, config.max_suggestions);

  // 5. Log shown matches
  if (filtered.length > 0) {
    const historyRows = filtered.map(m => ({
      viewer_profile_id: profileId,
      suggested_profile_id: m.profile_id,
      match_score: m.match_score,
      was_shown: true,
      shown_at: new Date().toISOString(),
    }));
    
    await supabase.from('match_history').upsert(historyRows, {
      onConflict: 'viewer_profile_id, suggested_profile_id',
      ignoreDuplicates: false,
    });
  }

  return filtered;
}

/**
 * Use a connection credit
 */
export async function useConnectionCredit(profileId: string): Promise<{ success: boolean; credits_remaining: number }> {
  const supabase = supabaseService();
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('connection_credits_remaining, connection_credits_used')
    .eq('id', profileId)
    .single();

  if (error || !profile) return { success: false, credits_remaining: 0 };

  if (profile.connection_credits_remaining <= 0) {
    return { success: false, credits_remaining: 0 };
  }

  const { error: updateError } = await supabase
    .from('profiles')
    .update({
      connection_credits_remaining: profile.connection_credits_remaining - 1,
      connection_credits_used: (profile.connection_credits_used || 0) + 1,
    })
    .eq('id', profileId);

  if (updateError) return { success: false, credits_remaining: 0 };

  return { success: true, credits_remaining: profile.connection_credits_remaining - 1 };
}

/**
 * Toggle matching opt-in
 */
export async function toggleMatchingOptIn(profileId: string, allow: boolean): Promise<boolean> {
  const supabase = supabaseService();
  const { error } = await supabase
    .from('profiles')
    .update({ allow_matching: allow })
    .eq('id', profileId);

  return !error;
}
