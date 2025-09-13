import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseService } from '@/lib/supabaseService';

export const dynamic = 'force-dynamic';

// POST /api/jobs/[id]/apply - Apply to a job
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  console.log('🔍 Job application route called');
  try {
    const { userId } = await auth();
    console.log('🔍 Auth result:', { userId });
    
    if (!userId) {
      console.log('🔍 No userId, returning 401');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: jobId } = await params;
    console.log('🔍 Job application request received:', { jobId, userId });
    
    const body = await request.json();
    const { cover_note, proposed_rate, proposed_payout_type, proposed_timeline } = body;
    
    console.log('🔍 Application data:', { cover_note, proposed_rate, proposed_payout_type, proposed_timeline });

    const supabase = supabaseService();

    // Get user's profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, visibility_state')
      .eq('clerk_id', userId)
      .single();

    if (profileError || !profile) {
      console.log('🔍 Profile not found:', profileError);
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    if (profile.visibility_state !== 'verified') {
      console.log('🔍 Profile not verified:', profile.visibility_state);
      return NextResponse.json({ error: 'Only verified profiles can apply to jobs' }, { status: 403 });
    }

    // Check if job exists and is open
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .select('id, status, created_by, title')
      .eq('id', jobId)
      .single();

    if (jobError || !job) {
      console.log('🔍 Job not found:', jobError);
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    if (job.status !== 'open') {
      console.log('🔍 Job not open:', job.status);
      return NextResponse.json({ error: 'Job is not accepting applications' }, { status: 400 });
    }

    // Prevent applying to own job
    if (job.created_by === userId) {
      console.log('🔍 Cannot apply to own job');
      return NextResponse.json({ error: 'Cannot apply to your own job' }, { status: 400 });
    }

    // Check if already applied
    const { data: existingApplication } = await supabase
      .from('job_applications')
      .select('id')
      .eq('job_id', jobId)
      .eq('applicant_profile_id', profile.id)
      .single();

    if (existingApplication) {
      console.log('🔍 Already applied');
      return NextResponse.json({ error: 'You have already applied to this job' }, { status: 400 });
    }

    // Create application
    const { data: application, error: applicationError } = await supabase
      .from('job_applications')
      .insert({
        job_id: jobId,
        applicant_profile_id: profile.id,
        cover_note: cover_note,
        proposed_rate: proposed_rate,
        proposed_payout_type: proposed_payout_type,
        proposed_timeline: proposed_timeline,
        status: 'pending'
      })
      .select()
      .single();

    if (applicationError) {
      console.log('🔍 Application creation error:', applicationError);
      return NextResponse.json({ error: 'Failed to create application' }, { status: 500 });
    }

    console.log('🔍 Application created successfully:', application.id);

    return NextResponse.json({ application }, { status: 201 });
  } catch (error) {
    console.error('🔍 Job application error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
