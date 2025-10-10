import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { auth } from '@clerk/nextjs/server';

// Check if user is admin
async function checkAdmin() {
  const { userId } = await auth();
  console.log('🔍 [Firms API] Checking admin for userId:', userId);
  
  if (!userId) {
    console.log('🔍 [Firms API] No userId found');
    return { isAdmin: false, userId: null };
  }

  const supabase = createServerClient();
  // Try both clerk_id and user_id for compatibility
  let { data: profile, error: clerkError } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('clerk_id', userId)
    .single();
  
  console.log('🔍 [Firms API] clerk_id check:', { profile, clerkError });
  
  // Fallback to user_id if clerk_id didn't find anything
  if (!profile) {
    console.log('🔍 [Firms API] Trying user_id fallback...');
    const result = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('user_id', userId)
      .single();
    profile = result.data;
    console.log('🔍 [Firms API] user_id check:', { profile, error: result.error });
  }

  const isAdmin = profile?.is_admin === true;
  console.log('🔍 [Firms API] Final admin status:', isAdmin);
  
  return { isAdmin, userId };
}

// GET /api/admin/firms - List firms with search, sort, pagination
export async function GET(request: NextRequest) {
  try {
    const { isAdmin } = await checkAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('query') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '50');
    const sort = searchParams.get('sort') || 'firm_name.asc';

    // Parse sort param (format: "column.direction")
    const [sortColumn, sortDirection] = sort.split('.');
    const validColumns = [
      'firm_name',
      'website_url',
      'linkedin_url',
      'firm_size',
      'annual_returns_range',
      'team_size_verified',
      'confidence_level',
      'last_verified_on',
      'created_at'
    ];
    const column = validColumns.includes(sortColumn) ? sortColumn : 'firm_name';
    const direction = sortDirection === 'desc' ? 'desc' : 'asc';

    const supabase = createServerClient();

    // Build query
    let queryBuilder = supabase
      .from('profiles')
      .select('id, firm_name, website_url, linkedin_url, firm_size, annual_returns_range, specializations, team_size_verified, team_page_url, specialty_verified, confidence_level, last_verified_on, created_at', { count: 'exact' })
      .eq('is_deleted', false);

    // Apply search filter
    if (query) {
      queryBuilder = queryBuilder.or(
        `firm_name.ilike.%${query}%,website_url.ilike.%${query}%,linkedin_url.ilike.%${query}%,specialty_verified.ilike.%${query}%`
      );
    }

    // Get total count
    const { count } = await queryBuilder;

    // Apply sort and pagination
    queryBuilder = queryBuilder
      .order(column, { ascending: direction === 'asc' })
      .range((page - 1) * pageSize, page * pageSize - 1);

    const { data: rows, error } = await queryBuilder;

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    return NextResponse.json({
      rows: rows || [],
      total: count || 0,
      page,
      pageSize
    });
  } catch (error) {
    console.error('Error fetching firms:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/admin/firms - Bulk upsert firms (optional)
export async function POST(request: NextRequest) {
  try {
    const { isAdmin } = await checkAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    const firms = body.firms as Array<{
      firm_name?: string;
      website_url: string;
      linkedin_url?: string;
    }>;

    if (!Array.isArray(firms)) {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const supabase = createServerClient();
    const results = [];

    for (const firm of firms) {
      if (!firm.website_url) continue;

      // Upsert by website_url (case-insensitive)
      const { data, error } = await supabase
        .from('profiles')
        .upsert(
          {
            website_url: firm.website_url.toLowerCase(),
            firm_name: firm.firm_name || null,
            linkedin_url: firm.linkedin_url || null,
            updated_at: new Date().toISOString()
          },
          {
            onConflict: 'website_url',
            ignoreDuplicates: false
          }
        )
        .select('id')
        .single();

      if (error) {
        results.push({ website_url: firm.website_url, success: false, error: error.message });
      } else {
        results.push({ website_url: firm.website_url, success: true, id: data.id });
      }
    }

    return NextResponse.json({ results });
  } catch (error) {
    console.error('Error upserting firms:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

