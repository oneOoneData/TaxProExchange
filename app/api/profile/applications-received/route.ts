import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get current user's profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, is_admin')
      .eq('clerk_id', userId)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    console.log('API: Looking for applications for profile ID:', profile.id);
    console.log('API: User ID:', userId);
    console.log('API: Is admin:', profile.is_admin);

    // Get applications for jobs created by this user ONLY
    // SECURITY: Always filter by job ownership, even for admins
    // Note: created_by in jobs table stores the Clerk user ID, not profile ID
    const { data: applications, error: applicationsError } = await supabase
      .from('job_applications')
      .select(`
        id,
        cover_note,
        proposed_rate,
        proposed_payout_type,
        proposed_timeline,
        status,
        created_at,
        notes,
        job:jobs(
          id,
          title,
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
      .eq('job.created_by', userId)  // SECURITY: Always filter by job ownership
      .order('created_at', { ascending: false });

    if (applicationsError) {
      console.error('Error fetching received applications:', applicationsError);
      return NextResponse.json({ error: 'Failed to fetch applications' }, { status: 500 });
    }

    console.log('API: Found applications:', applications?.length || 0);
    console.log('API: Applications data:', applications);
    console.log('API: Filtering by userId:', userId);
    console.log('API: Profile ID:', profile.id);

    // Debug: Check what jobs exist for this user
    const { data: userJobs, error: jobsError } = await supabase
      .from('jobs')
      .select('id, title, created_by')
      .eq('created_by', userId);
    
    console.log('API: User jobs found:', userJobs?.length || 0);
    console.log('API: User jobs data:', userJobs);
    
    // Transform the data to handle job and applicant as array vs object
    const transformedApplications = applications?.map(app => {
      const job = Array.isArray(app.job) ? app.job[0] : app.job;
      const applicant = Array.isArray(app.applicant) ? app.applicant[0] : app.applicant;
      return {
        ...app,
        job,
        applicant
      };
    }) || [];
    
    // Log each application to see what's missing
    transformedApplications.forEach((app, index) => {
      const job = app.job as any;
      const applicant = app.applicant as any;
      console.log(`API: Application ${index}:`, {
        id: app.id,
        hasJob: !!job,
        jobTitle: job?.title,
        jobId: job?.id,
        hasApplicant: !!applicant,
        applicantName: applicant ? `${applicant.first_name} ${applicant.last_name}` : 'No applicant',
        rawJob: app.job
      });
    });

    return NextResponse.json({ applications: transformedApplications });

  } catch (error) {
    console.error('Error in /api/profile/applications-received:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
