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
      .select('id')
      .eq('clerk_id', userId)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // Get applications for jobs created by this user
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
          created_at
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
      .eq('job.created_by', profile.id)
      .order('created_at', { ascending: false });

    if (applicationsError) {
      console.error('Error fetching received applications:', applicationsError);
      return NextResponse.json({ error: 'Failed to fetch applications' }, { status: 500 });
    }

    console.log('API: Found applications:', applications?.length || 0);
    console.log('API: Applications data:', applications);
    
    // Transform the data to handle job as array vs object
    const transformedApplications = applications?.map(app => {
      const job = Array.isArray(app.job) ? app.job[0] : app.job;
      return {
        ...app,
        job
      };
    }) || [];
    
    // Log each application to see what's missing
    transformedApplications.forEach((app, index) => {
      console.log(`API: Application ${index}:`, {
        id: app.id,
        hasJob: !!app.job,
        jobTitle: app.job?.title,
        hasApplicant: !!app.applicant,
        applicantName: app.applicant ? `${app.applicant.first_name} ${app.applicant.last_name}` : 'No applicant'
      });
    });

    return NextResponse.json({ applications: transformedApplications });

  } catch (error) {
    console.error('Error in /api/profile/applications-received:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
