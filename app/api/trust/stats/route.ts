import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.warn('Supabase environment variables not configured');
}

const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

export async function GET() {
  try {
    // Check if Supabase is configured
    if (!supabase) {
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 503 }
      );
    }

    // Get verified and listed profiles count
    const { count: verifiedProfiles } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('visibility_state', 'verified')
      .eq('is_listed', true);

    // Get count by credential type (CPA, EA, CTEC)
    const { data: credentialData } = await supabase
      .from('profiles')
      .select('credential_type')
      .eq('visibility_state', 'verified')
      .eq('is_listed', true);

    const credentialCounts = {
      cpa: 0,
      ea: 0,
      ctec: 0,
      attorney: 0,
    };

    credentialData?.forEach((profile) => {
      if (profile.credential_type) {
        const type = profile.credential_type.toLowerCase();
        if (type === 'cpa') credentialCounts.cpa++;
        else if (type === 'ea' || type === 'enrolled_agent') credentialCounts.ea++;
        else if (type === 'ctec') credentialCounts.ctec++;
        else if (type === 'attorney') credentialCounts.attorney++;
      }
    });

    // Get distinct states covered by verified and listed professionals
    // First get the verified profile IDs
    const { data: verifiedProfileIds } = await supabase
      .from('profiles')
      .select('id')
      .eq('visibility_state', 'verified')
      .eq('is_listed', true);

    const profileIds = verifiedProfileIds?.map(p => p.id) || [];

    // Then get their locations
    let statesCovered = 0;
    if (profileIds.length > 0) {
      const { data: statesData } = await supabase
        .from('profile_locations')
        .select('locations!inner(state)')
        .in('profile_id', profileIds);

      // Count distinct states (filter out null values)
      const uniqueStates = new Set(
        statesData
          ?.map((item: any) => item.locations?.state)
          .filter((state: string | null) => state !== null)
      );
      statesCovered = uniqueStates.size;
    }

    return NextResponse.json({
      verifiedProfiles: verifiedProfiles || 0,
      statesCovered: statesCovered || 0,
      credentialCounts,
      lastUpdated: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Trust stats error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

