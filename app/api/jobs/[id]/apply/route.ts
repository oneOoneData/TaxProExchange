import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseService } from '@/lib/supabaseService';

export const dynamic = 'force-dynamic';

// POST /api/jobs/[id]/apply - Apply to a job
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: jobId } = await params;
    const body = await request.json();
    const { cover_note, proposed_rate, proposed_payout_type, proposed_timeline } = body;

    const supabase = supabaseService();

    // Check if user can apply (verified preparer)
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, visibility_state')
      .eq('clerk_id', userId)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    if (profile.visibility_state !== 'verified') {
      return NextResponse.json({ error: 'Only verified profiles can apply to jobs' }, { status: 403 });
    }

    // Check if job exists and is open
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .select('id, status, created_by')
      .eq('id', jobId)
      .single();

    if (jobError || !job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    if (job.status !== 'open') {
      return NextResponse.json({ error: 'Job is not accepting applications' }, { status: 400 });
    }

    // Prevent applying to own job
    if (job.created_by === userId) {
      return NextResponse.json({ error: 'Cannot apply to your own job' }, { status: 400 });
    }

    // Check if already applied
    const { data: existingApplication, error: checkError } = await supabase
      .from('job_applications')
      .select('id')
      .eq('job_id', jobId)
      .eq('applicant_profile_id', profile.id)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Application check error:', checkError);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    if (existingApplication) {
      return NextResponse.json({ error: 'Already applied to this job' }, { status: 400 });
    }

    // Create the application
    const { data: application, error: applicationError } = await supabase
      .from('job_applications')
      .insert({
        job_id: jobId,
        applicant_profile_id: profile.id,
        applicant_user_id: userId,
        cover_note: cover_note || '',
        proposed_rate: proposed_rate || null,
        proposed_payout_type: proposed_payout_type || null,
        proposed_timeline: proposed_timeline || '',
        status: 'applied'
      })
      .select()
      .single();

    if (applicationError) {
      console.error('Application creation error:', applicationError);
      return NextResponse.json({ error: 'Failed to submit application' }, { status: 500 });
    }

    return NextResponse.json({ application }, { status: 201 });
  } catch (error) {
    console.error('Job application error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET /api/jobs/[id]/apply - Get applications for a job (job owner only)
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: jobId } = await params;
    const supabase = supabaseService();

    // Check if user owns this job
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .select('created_by')
      .eq('id', jobId)
      .single();

    if (jobError || !job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    if (job.created_by !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get applications with applicant details
    const { data: applications, error: applicationsError } = await supabase
      .from('job_applications')
      .select(`
        *,
        profiles!job_applications_applicant_profile_id_fkey(
          first_name,
          last_name,
          headline,
          credential_type,
          slug
        )
      `)
      .eq('job_id', jobId)
      .order('created_at', { ascending: false });

    if (applicationsError) {
      console.error('Applications fetch error:', applicationsError);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    return NextResponse.json({
      applications: applications?.map(app => ({
        ...app,
        applicant: {
          name: `${app.profiles?.first_name} ${app.profiles?.last_name}`,
          headline: app.profiles?.headline,
          credential_type: app.profiles?.credential_type,
          slug: app.profiles?.slug
        }
      })) || []
    });
  } catch (error) {
    console.error('Applications fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
