import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.warn('Supabase environment variables not configured');
}

const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

// Helper to count words in a string
function countWords(text: string | null): number {
  if (!text) return 0;
  return text.trim().split(/\s+/).filter(w => w.length > 0).length;
}

// Helper to estimate total profile word count
function calculateProfileWordCount(profile: any): number {
  let total = 0;
  
  // Name and credential (e.g., "John Smith, CPA")
  total += countWords(`${profile.first_name} ${profile.last_name} ${profile.credential_type}`);
  
  // Headline
  total += countWords(profile.headline);
  
  // Bio (main content)
  total += countWords(profile.bio);
  
  // Opportunities
  total += countWords(profile.opportunities);
  
  // Specializations (treat as words)
  if (profile.specializations && Array.isArray(profile.specializations)) {
    total += profile.specializations.length * 2; // Rough estimate: 2 words per specialization
  }
  
  // States
  if (profile.states && Array.isArray(profile.states)) {
    total += profile.states.length; // State codes = 1 word each
  }
  
  return total;
}

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Verify admin status
    if (!supabase) {
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 503 }
      );
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('clerk_id', userId)
      .single();

    if (!profile?.is_admin) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    // Fetch all verified profiles with relevant fields
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select(`
        id,
        first_name,
        last_name,
        public_email,
        credential_type,
        headline,
        bio,
        opportunities,
        specializations,
        states,
        firm_name,
        slug,
        visibility_state,
        is_listed,
        created_at,
        updated_at
      `)
      .eq('is_listed', true)
      .eq('visibility_state', 'verified')
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Error fetching profiles:', error);
      return NextResponse.json(
        { error: 'Failed to fetch profiles' },
        { status: 500 }
      );
    }

    // Calculate word counts and filter thin profiles
    const profilesWithWordCount = (profiles || []).map(profile => {
      const wordCount = calculateProfileWordCount(profile);
      const bioLength = countWords(profile.bio);
      
      return {
        id: profile.id,
        name: `${profile.first_name} ${profile.last_name}`,
        email: profile.public_email,
        credential_type: profile.credential_type,
        firm_name: profile.firm_name,
        slug: profile.slug,
        headline: profile.headline,
        bio: profile.bio,
        bio_word_count: bioLength,
        total_word_count: wordCount,
        specializations_count: profile.specializations?.length || 0,
        states_count: profile.states?.length || 0,
        specializations: profile.specializations,
        states: profile.states,
        created_at: profile.created_at,
        updated_at: profile.updated_at,
      };
    });

    // Filter for thin profiles (<120 words OR empty bio)
    const thinProfiles = profilesWithWordCount.filter(p => 
      p.total_word_count < 120 || p.bio_word_count < 50
    );

    // Sort by word count (thinnest first)
    thinProfiles.sort((a, b) => a.total_word_count - b.total_word_count);

    return NextResponse.json({
      success: true,
      total_profiles: profiles?.length || 0,
      thin_profiles_count: thinProfiles.length,
      thin_profiles: thinProfiles,
      threshold: 120,
    });

  } catch (error) {
    console.error('Error in thin-profiles API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}


