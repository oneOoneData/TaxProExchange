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
      .select('id, first_name, last_name, visibility_state, professional_title')
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
      .select(`
        id, 
        status, 
        created_by, 
        title,
        profiles!jobs_created_by_fkey(firm_name)
      `)
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
        applicant_user_id: userId,
        cover_note: cover_note,
        proposed_rate: proposed_rate,
        proposed_payout_type: proposed_payout_type,
        proposed_timeline: proposed_timeline,
        status: 'applied'
      })
      .select()
      .single();

    if (applicationError) {
      console.log('🔍 Application creation error:', applicationError);
      return NextResponse.json({ error: 'Failed to create application' }, { status: 500 });
    }

    console.log('🔍 Application created successfully:', application.id);

    // Send notification emails (don't fail the application if emails fail)
    const applicantName = `${profile.first_name} ${profile.last_name}`;
    
    // 1. Notify job poster about new application
    try {
      await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/notify/job-application-received`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          job_id: jobId,
          applicant_name: applicantName,
          applicant_headline: profile.professional_title || 'Tax Professional',
          proposed_rate: proposed_rate,
          proposed_timeline: proposed_timeline,
          cover_note: cover_note,
        }),
      });
      console.log(`Job poster notification sent for application ${application.id}`);
    } catch (notificationError) {
      console.error('Failed to send job poster notification:', notificationError);
      // Don't fail the application if notification fails
    }

    // 2. Send confirmation email to applicant
    try {
      await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/notify/application-confirmation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          job_id: jobId,
          job_title: job.title,
          firm_name: (job.profiles as any)?.firm_name || null,
          applicant_name: applicantName,
          applicant_clerk_id: userId,
          cover_note: cover_note,
          proposed_rate: proposed_rate,
          proposed_timeline: proposed_timeline,
        }),
      });
      console.log(`Applicant confirmation sent for application ${application.id}`);
    } catch (notificationError) {
      console.error('Failed to send applicant confirmation:', notificationError);
      // Don't fail the application if notification fails
    }

    return NextResponse.json({ application }, { status: 201 });
  } catch (error) {
    console.error('🔍 Job application error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
