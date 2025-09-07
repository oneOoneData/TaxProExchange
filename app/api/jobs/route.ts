import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseService } from '@/lib/supabaseService';

export const dynamic = 'force-dynamic';

// GET /api/jobs - List jobs with filters
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const supabase = supabaseService();
    
    // Build query with filters
    let query = supabase
      .from('jobs')
      .select('*')
      .eq('status', 'open')
      .order('created_at', { ascending: false });

    // Apply filters
    const specialization = searchParams.get('specialization');
    const state = searchParams.get('state');
    const payoutType = searchParams.get('payout_type');
    const minPayout = searchParams.get('min_payout');
    const deadlineFilter = searchParams.get('deadline');
    const remote = searchParams.get('remote');

    if (specialization) {
      query = query.contains('specialization_keys', [specialization]);
    }

    if (state) {
      query = query.contains('location_states', [state]);
    }

    if (payoutType) {
      query = query.eq('payout_type', payoutType);
    }

    if (minPayout) {
      const min = parseFloat(minPayout);
      if (!isNaN(min)) {
        query = query.or(`payout_fixed.gte.${min},payout_min.gte.${min}`);
      }
    }

    if (deadlineFilter) {
      const today = new Date();
      let targetDate = new Date();
      
      switch (deadlineFilter) {
        case 'this_week':
          targetDate.setDate(today.getDate() + 7);
          break;
        case 'next_30_days':
          targetDate.setDate(today.getDate() + 30);
          break;
        case 'next_60_days':
          targetDate.setDate(today.getDate() + 60);
          break;
      }
      
      query = query.lte('deadline_date', targetDate.toISOString().split('T')[0]);
    }

    if (remote !== null) {
      query = query.eq('remote_ok', remote === 'true');
    }

    const { data: jobs, error } = await query;

    if (error) {
      console.error('Jobs fetch error:', error);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    // Get firm information for each job
    const jobsWithFirms = await Promise.all(
      jobs?.map(async (job) => {
        const { data: profile } = await supabase
          .from('profiles')
          .select('first_name, last_name, firm_name, visibility_state, slug')
          .eq('clerk_id', job.created_by)
          .single();

        return {
          ...job,
          firm: {
            name: profile?.firm_name || `${profile?.first_name} ${profile?.last_name}` || 'Unknown Firm',
            verified: profile?.visibility_state === 'verified',
            slug: profile?.slug
          }
        };
      }) || []
    );

    // Filter out jobs from unverified profiles
    const filteredJobs = jobsWithFirms.filter(job => job.firm.verified);

    return NextResponse.json({ jobs: filteredJobs });
  } catch (error) {
    console.error('Jobs API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/jobs - Create new job
export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    console.log('Auth result - userId:', userId);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      title,
      description,
      deadline_date,
      payout_type,
      payout_fixed,
      payout_min,
      payout_max,
      payment_terms,
      credentials_required,
      software_required,
      specialization_keys,
      location_states,
      volume_count,
      working_expectations_md,
      draft_eta_date,
      final_review_buffer_days,
      pro_liability_required,
      free_consultation_required,
      // Legacy fields for backward compatibility
      sla,
      trial_ok,
      insurance_required,
      location_us_only,
      location_countries,
      remote_ok
    } = body;

    // Validate required fields
    if (!title || !description || !payout_type) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Validate payout logic
    if (payout_type === 'fixed' && !payout_fixed) {
      return NextResponse.json({ error: 'Fixed payout requires payout_fixed amount' }, { status: 400 });
    }
    if ((payout_type === 'hourly' || payout_type === 'per_return') && (!payout_min || !payout_max)) {
      return NextResponse.json({ error: 'Hourly/per_return payout requires min and max amounts' }, { status: 400 });
    }
    if (payout_type === 'discussed' && (payout_fixed || payout_min || payout_max)) {
      return NextResponse.json({ error: 'Amount fields should be empty when payout type is "To be discussed"' }, { status: 400 });
    }

    const supabase = supabaseService();

    // Check if user can post jobs (verified firm)
    console.log('Looking for profile with clerk_id:', userId);
    
    // First, let's check if there are any profiles at all
    const { data: allProfiles, error: allProfilesError } = await supabase
      .from('profiles')
      .select('id, clerk_id, first_name, last_name')
      .limit(5);
    
    console.log('Sample profiles in database:', allProfiles);
    
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, visibility_state, firm_name, clerk_id')
      .eq('clerk_id', userId)
      .single();

    console.log('Profile query result:', { profile, profileError });

    if (profileError || !profile) {
      console.log('Profile not found, error:', profileError);
      return NextResponse.json({ 
        error: 'Profile not found. Please complete your profile setup first.',
        code: 'PROFILE_NOT_FOUND',
        details: 'You need to create and verify your profile before posting jobs.'
      }, { status: 404 });
    }

    if (profile.visibility_state !== 'verified') {
      return NextResponse.json({ error: 'Only verified profiles can post jobs' }, { status: 403 });
    }

    if (!profile.firm_name) {
      return NextResponse.json({ error: 'Only firms can post jobs' }, { status: 403 });
    }

    // Create the job
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .insert({
        created_by: userId,
        title,
        description,
        deadline_date,
        payout_type,
        payout_fixed,
        payout_min,
        payout_max,
        payment_terms,
        credentials_required: credentials_required || [],
        software_required: software_required || [],
        specialization_keys: specialization_keys || [],
        location_states: location_states || [],
        volume_count,
        working_expectations_md,
        draft_eta_date,
        final_review_buffer_days: final_review_buffer_days || 3,
        pro_liability_required: pro_liability_required || false,
        free_consultation_required: free_consultation_required || false,
        // Legacy fields for backward compatibility
        sla: sla || {},
        trial_ok: trial_ok || false,
        insurance_required: pro_liability_required || false, // Use new field value for legacy compatibility
        location_us_only: location_us_only !== false,
        location_countries: location_countries || [],
        remote_ok: remote_ok !== false
      })
      .select()
      .single();

    if (jobError) {
      console.error('Job creation error:', jobError);
      return NextResponse.json({ error: 'Failed to create job' }, { status: 500 });
    }

    return NextResponse.json({ job: job }, { status: 201 });
  } catch (error) {
    console.error('Job creation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
