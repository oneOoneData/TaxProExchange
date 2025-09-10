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
    // First, try to get the user's email from Clerk
    let userEmail: string | null = null;
    try {
      const response = await fetch(`https://api.clerk.com/v1/users/${userId}`, {
        headers: {
          'Authorization': `Bearer ${process.env.CLERK_SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const userData = await response.json();
        if (userData.primary_email_address_id && userData.email_addresses) {
          const primaryEmail = userData.email_addresses.find((e: any) => e.id === userData.primary_email_address_id);
          if (primaryEmail) {
            userEmail = primaryEmail.email_address;
          }
        } else if (userData.email_addresses && userData.email_addresses.length > 0) {
          userEmail = userData.email_addresses[0].email_address;
        }
      }
    } catch (error) {
      console.log('🔍 Could not fetch email from Clerk, will use clerk_id lookup:', error);
    }
    
    console.log('🔍 User email from Clerk:', userEmail);
    
    // Try to find profile by email first (more reliable across environments)
    let profile = null;
    let profileError = null;
    
    if (userEmail) {
      console.log('🔍 Searching for profile by email:', userEmail);
      const { data: emailProfile, error: emailError } = await supabase
        .from('profiles')
        .select('id, visibility_state, first_name, last_name, headline')
        .eq('public_email', userEmail)
        .single();
      
      if (emailProfile) {
        console.log('🔍 Profile found by email:', emailProfile.id);
        profile = emailProfile;
      } else if (emailError && emailError.code !== 'PGRST116') {
        console.error('🔍 Error searching by email:', emailError);
      }
    }
    
    // If no profile found by email, try by clerk_id
    if (!profile) {
      console.log('🔍 Searching for profile by clerk_id:', userId);
      const { data: clerkProfile, error: clerkError } = await supabase
        .from('profiles')
        .select('id, visibility_state, first_name, last_name, headline')
        .eq('clerk_id', userId)
        .single();
      
      profile = clerkProfile;
      profileError = clerkError;
    }

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    if (profile.visibility_state !== 'verified') {
      return NextResponse.json({ error: 'Only verified profiles can apply to jobs' }, { status: 403 });
    }

    // Check if job exists and is open
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .select('id, status, created_by, title')
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

    // Auto-connect: Create connection between job poster and applicant
    try {
      // Get job poster's profile ID
      const { data: jobPosterProfile, error: jobPosterError } = await supabase
        .from('profiles')
        .select('id')
        .eq('clerk_id', job.created_by)
        .single();

      if (!jobPosterError && jobPosterProfile) {
        // Check if connection already exists
        const { data: existingConnection } = await supabase
          .from('connections')
          .select('id, status')
          .or(`and(requester_profile_id.eq.${profile.id},recipient_profile_id.eq.${jobPosterProfile.id}),and(requester_profile_id.eq.${jobPosterProfile.id},recipient_profile_id.eq.${profile.id})`)
          .single();

        // Create connection if it doesn't exist
        if (!existingConnection) {
          const { data: connection, error: connectionError } = await supabase
            .from('connections')
            .insert({
              requester_profile_id: profile.id, // Applicant initiates the connection
              recipient_profile_id: jobPosterProfile.id,
              status: 'accepted' // Auto-accept since they're applying to their job
            })
            .select()
            .single();

          if (connectionError) {
            console.error('Auto-connect creation error:', connectionError);
            // Don't fail the application if connection creation fails
          } else {
            console.log('Auto-connect created:', connection.id);
          }
        }
      }
    } catch (autoConnectError) {
      console.error('Auto-connect error:', autoConnectError);
      // Don't fail the application if auto-connect fails
    }

    // Send notification email to job poster about new application
    try {
      await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/notify/job-application-received`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Secret': process.env.WEBHOOK_SECRET || '',
        },
        body: JSON.stringify({
          job_id: jobId,
          application_id: application.id,
          job_title: job.title,
          applicant_name: `${profile.first_name} ${profile.last_name}`,
          applicant_headline: profile.headline || 'Tax Professional',
          cover_note: cover_note || '',
          proposed_rate: proposed_rate || null,
          proposed_timeline: proposed_timeline || null
        }),
      });
    } catch (emailError) {
      console.error('Failed to send application notification:', emailError);
      // Don't fail the request if email fails
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
