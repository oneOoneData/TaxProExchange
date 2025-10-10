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
  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('user_id', userId)
    .single();

  return { isAdmin: profile?.is_admin === true, userId };
}

// POST /api/admin/enrich - Run enrichment on selected/filtered firms
export async function POST(request: NextRequest) {
  try {
    const { isAdmin } = await checkAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    const { ids, query, sort, all } = body as {
      ids?: string[];
      query?: string;
      sort?: string;
      all?: boolean;
    };

    const supabase = createServerClient();
    let profiles: Array<{ id: string; website_url: string }> = [];

    if (ids && ids.length > 0) {
      // Enrich specific IDs
      const { data, error } = await supabase
        .from('profiles')
        .select('id, website_url')
        .in('id', ids)
        .eq('is_deleted', false)
        .not('website_url', 'is', null);

      if (error) {
        return NextResponse.json({ error: 'Database error' }, { status: 500 });
      }
      profiles = data || [];
    } else if (all) {
      // Enrich all non-deleted profiles with websites
      const { data, error } = await supabase
        .from('profiles')
        .select('id, website_url')
        .eq('is_deleted', false)
        .not('website_url', 'is', null);

      if (error) {
        return NextResponse.json({ error: 'Database error' }, { status: 500 });
      }
      profiles = data || [];
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
    const result = await enrichProfiles(profiles, 4);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error running enrichment:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

