import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { auth } from '@clerk/nextjs/server';
import { enrichProfiles } from '@/lib/enrichment/siteEnricher';

// Check if user is admin
async function checkAdmin() {
  const { userId } = await auth();
  if (!userId) {
    return { isAdmin: false, userId: null };
  }

  const supabase = createServerClient();
  // Try both clerk_id and user_id for compatibility
  let { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('clerk_id', userId)
    .single();
  
  // Fallback to user_id if clerk_id didn't find anything
  if (!profile) {
    const result = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('user_id', userId)
      .single();
    profile = result.data;
  }

  return { isAdmin: profile?.is_admin === true, userId };
}

// POST /api/admin/enrich - Run enrichment on selected/filtered firms
export async function POST(request: NextRequest) {
  console.log('🔍 [Enrich API] POST /api/admin/enrich called');
  
  try {
    console.log('🔍 [Enrich API] Checking admin...');
    const { isAdmin } = await checkAdmin();
    console.log('🔍 [Enrich API] Admin check result:', isAdmin);
    
    if (!isAdmin) {
      console.log('🔍 [Enrich API] Unauthorized - not admin');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    console.log('🔍 [Enrich API] Parsing request body...');
    const body = await request.json();
    console.log('🔍 [Enrich API] Request body:', body);
    const { ids, query, sort, all, unenrichedOnly } = body as {
      ids?: string[];
      query?: string;
      sort?: string;
      all?: boolean;
      unenrichedOnly?: boolean;
    };

    const supabase = createServerClient();
    let profiles: Array<{ id: string; website_url: string }> = [];

    if (ids && ids.length > 0) {
      // Enrich specific IDs
      console.log('🔍 [Enrich API] Fetching profiles for IDs:', ids);
      const { data, error } = await supabase
        .from('profiles')
        .select('id, website_url')
        .in('id', ids)
        .eq('is_deleted', false)
        .not('website_url', 'is', null);

      if (error) {
        console.error('❌ [Enrich API] Database error:', error);
        return NextResponse.json({ error: 'Database error' }, { status: 500 });
      }
      profiles = data || [];
      console.log(`🔍 [Enrich API] Found ${profiles.length} profiles with website URLs:`, profiles);
    } else if (all) {
      // Enrich all non-deleted profiles with websites
      console.log('🔍 [Enrich API] Fetching all profiles with websites...');
      let queryBuilder = supabase
        .from('profiles')
        .select('id, website_url')
        .eq('is_deleted', false)
        .not('website_url', 'is', null);
      
      // Only enrich unenriched profiles if requested
      if (unenrichedOnly) {
        console.log('🔍 [Enrich API] Filtering to only unenriched profiles...');
        queryBuilder = queryBuilder.is('last_verified_on', null);
      }

      const { data, error } = await queryBuilder;

      if (error) {
        console.error('❌ [Enrich API] Database error:', error);
        return NextResponse.json({ error: 'Database error' }, { status: 500 });
      }
      profiles = data || [];
      console.log(`🔍 [Enrich API] Found ${profiles.length} profiles to enrich`);
    } else if (query !== undefined || sort !== undefined) {
      // Enrich filtered set
      let queryBuilder = supabase
        .from('profiles')
        .select('id, website_url')
        .eq('is_deleted', false)
        .not('website_url', 'is', null);

      // Apply search filter
      if (query) {
        queryBuilder = queryBuilder.or(
          `firm_name.ilike.%${query}%,website_url.ilike.%${query}%,linkedin_url.ilike.%${query}%,specialty_verified.ilike.%${query}%`
        );
      }

      // Apply sort
      if (sort) {
        const [sortColumn, sortDirection] = sort.split('.');
        const validColumns = [
          'firm_name',
          'website_url',
          'linkedin_url',
          'firm_size',
          'annual_returns_range',
          'team_size_verified',
          'confidence_level',
          'last_verified_on'
        ];
        const column = validColumns.includes(sortColumn) ? sortColumn : 'firm_name';
        const direction = sortDirection === 'desc' ? 'desc' : 'asc';
        queryBuilder = queryBuilder.order(column, { ascending: direction === 'asc' });
      }

      const { data, error } = await queryBuilder;

      if (error) {
        return NextResponse.json({ error: 'Database error' }, { status: 500 });
      }
      profiles = data || [];
    } else {
      return NextResponse.json(
        { error: 'Must provide ids, query/sort, or all=true' },
        { status: 400 }
      );
    }

    if (profiles.length === 0) {
      return NextResponse.json({
        total: 0,
        attempted: 0,
        updated: 0,
        skipped: 0,
        errors: []
      });
    }

    // Run enrichment with concurrency limit of 4
    console.log(`🔍 [Enrich API] Starting enrichment for ${profiles.length} profiles`);
    const result = await enrichProfiles(profiles, 4);
    console.log(`🔍 [Enrich API] Enrichment complete:`, result);

    return NextResponse.json(result);
  } catch (error) {
    console.error('❌ [Enrich API] Error running enrichment:', error);
    console.error('❌ [Enrich API] Error stack:', error instanceof Error ? error.stack : 'No stack');
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

