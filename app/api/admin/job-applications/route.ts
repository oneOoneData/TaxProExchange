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

// GET /api/admin/job-applications - Get all job applications (admin only)
export async function GET(request: NextRequest) {
  try {
    const { isAdmin, userId } = await checkAdmin();
    
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 403 }
      );
    }

    const supabase = createServerClient();
    const { searchParams } = new URL(request.url);
    
    // Query parameters for filtering
    const status = searchParams.get('status');
    const jobId = searchParams.get('jobId');
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Build query
    let query = supabase
      .from('job_applications')
      .select(`
        id,
        cover_note,
        proposed_rate,
        proposed_payout_type,
        proposed_timeline,
        status,
        created_at,
        updated_at,
        notes,
        job:jobs!inner(
          id,
          title,
          status,
          payout_type,
          payout_fixed,
          payout_min,
          payout_max,
          created_at,
          created_by
        ),
        applicant:profiles!job_applications_applicant_profile_id_fkey(
          id,
          first_name,
          last_name,
          headline,
          slug,
          firm_name,
          public_email,
          phone,
          credential_type
        )
      `)
      .order('created_at', { ascending: false });

    // Apply filters
    if (status) {
      query = query.eq('status', status);
    }
    if (jobId) {
      query = query.eq('job_id', jobId);
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data: applications, error } = await query;

    if (error) {
      console.error('Error fetching applications:', error);
      return NextResponse.json(
        { error: 'Failed to fetch applications' },
        { status: 500 }
      );
    }

    // Get total count for pagination
    let countQuery = supabase
      .from('job_applications')
      .select('id', { count: 'exact', head: true });

    if (status) {
      countQuery = countQuery.eq('status', status);
    }
    if (jobId) {
      countQuery = countQuery.eq('job_id', jobId);
    }

    const { count } = await countQuery;

    // Transform data to handle arrays
    const transformedApplications = applications?.map(app => {
      const job = Array.isArray(app.job) ? app.job[0] : app.job;
      const applicant = Array.isArray(app.applicant) ? app.applicant[0] : app.applicant;
      return {
        ...app,
        job,
        applicant
      };
    }) || [];

    return NextResponse.json({
      applications: transformedApplications,
      total: count || 0,
      limit,
      offset
    });

  } catch (error) {
    console.error('Admin job applications error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

