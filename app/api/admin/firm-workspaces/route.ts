import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { auth } from '@clerk/nextjs/server';

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

  const isAdmin = profile?.is_admin === true;
  
  return { isAdmin, userId };
}

// GET /api/admin/firm-workspaces - List actual firm workspace accounts
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
    const sort = searchParams.get('sort') || 'created_at.desc';

    // Parse sort param (format: "column.direction")
    const [sortColumn, sortDirection] = sort.split('.');
    const validColumns = ['name', 'website', 'size_band', 'returns_band', 'verified', 'created_at', 'subscription_status'];
    const column = validColumns.includes(sortColumn) ? sortColumn : 'created_at';
    const direction = sortDirection === 'desc' ? 'desc' : 'asc';

    const supabase = createServerClient();

    // Build query
    let queryBuilder = supabase
      .from('firms')
      .select('id, name, website, size_band, returns_band, verified, slug, created_at, subscription_status, stripe_customer_id, subscription_current_period_end, trial_ends_at', { count: 'exact' });

    // Apply search filter
    if (query) {
      queryBuilder = queryBuilder.or(
        `name.ilike.%${query}%,website.ilike.%${query}%,slug.ilike.%${query}%`
      );
    }

    // Get total count
    const { count } = await queryBuilder;

    // Apply sort and pagination
    queryBuilder = queryBuilder
      .order(column, { ascending: direction === 'asc' })
      .range((page - 1) * pageSize, page * pageSize - 1);

    const { data: firms, error } = await queryBuilder;

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    // Get activity stats for each firm
    const firmIds = firms?.map(f => f.id) || [];
    
    let memberCounts: Record<string, number> = {};
    let benchInvitesPending: Record<string, number> = {};
    let benchInvitesAccepted: Record<string, number> = {};
    let teamInvitesPending: Record<string, number> = {};
    let benchProsAdded: Record<string, number> = {};
    
    if (firmIds.length > 0) {
      // Active team members
      const { data: memberData } = await supabase
        .from('firm_members')
        .select('firm_id')
        .in('firm_id', firmIds)
        .eq('status', 'active');
      
      memberData?.forEach((m: any) => {
        memberCounts[m.firm_id] = (memberCounts[m.firm_id] || 0) + 1;
      });

      // Bench invitations sent (pending)
      const { data: benchPendingData } = await supabase
        .from('bench_invitations')
        .select('firm_id')
        .in('firm_id', firmIds)
        .eq('status', 'pending');
      
      benchPendingData?.forEach((b: any) => {
        benchInvitesPending[b.firm_id] = (benchInvitesPending[b.firm_id] || 0) + 1;
      });

      // Bench invitations accepted
      const { data: benchAcceptedData } = await supabase
        .from('bench_invitations')
        .select('firm_id')
        .in('firm_id', firmIds)
        .eq('status', 'accepted');
      
      benchAcceptedData?.forEach((b: any) => {
        benchInvitesAccepted[b.firm_id] = (benchInvitesAccepted[b.firm_id] || 0) + 1;
      });

      // Team member invitations sent (pending)
      const { data: teamInviteData } = await supabase
        .from('firm_member_invitations')
        .select('firm_id')
        .in('firm_id', firmIds)
        .eq('status', 'pending');
      
      teamInviteData?.forEach((t: any) => {
        teamInvitesPending[t.firm_id] = (teamInvitesPending[t.firm_id] || 0) + 1;
      });

      // Tax pros added to bench
      const { data: benchData } = await supabase
        .from('firm_trusted_bench')
        .select('firm_id')
        .in('firm_id', firmIds);
      
      benchData?.forEach((b: any) => {
        benchProsAdded[b.firm_id] = (benchProsAdded[b.firm_id] || 0) + 1;
      });
    }

    // Enhance firms with activity stats
    const enhancedFirms = firms?.map(firm => ({
      ...firm,
      member_count: memberCounts[firm.id] || 0,
      bench_invites_pending: benchInvitesPending[firm.id] || 0,
      bench_invites_accepted: benchInvitesAccepted[firm.id] || 0,
      team_invites_pending: teamInvitesPending[firm.id] || 0,
      bench_pros_count: benchProsAdded[firm.id] || 0,
    }));

    return NextResponse.json({
      rows: enhancedFirms || [],
      total: count || 0,
      page,
      pageSize
    });
  } catch (error) {
    console.error('Error fetching firm workspaces:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

