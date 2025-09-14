import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseService } from '@/lib/supabaseService';

export const dynamic = 'force-dynamic';

// GET /api/profile/applications - Get user's job applications
export async function GET(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = supabaseService();

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
    let foundByEmail = false;
    
    if (userEmail) {
      console.log('🔍 Searching for profile by email:', userEmail);
      const { data: emailProfile, error: emailError } = await supabase
        .from('profiles')
        .select('id, clerk_id')
        .eq('public_email', userEmail)
        .single();
      
      if (emailProfile) {
        console.log('🔍 Profile found by email:', emailProfile.id);
        profile = emailProfile;
        foundByEmail = true;
      } else if (emailError && emailError.code !== 'PGRST116') {
        console.error('🔍 Error searching by email:', emailError);
      }
    }
    
    // If no profile found by email, try by clerk_id
    if (!profile) {
      console.log('🔍 Searching for profile by clerk_id:', userId);
      const { data: clerkProfile, error: clerkError } = await supabase
        .from('profiles')
        .select('id, clerk_id')
        .eq('clerk_id', userId)
        .single();
      
      profile = clerkProfile;
      profileError = clerkError;
    }

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // Verify the user owns this profile
    // If we found the profile by email, trust that it's the right profile
    // If we found it by clerk_id, verify ownership
    if (!foundByEmail && profile.clerk_id !== userId) {
      console.log('🔍 Profile found by clerk_id but ownership verification failed:', { profileClerkId: profile.clerk_id, currentUserId: userId });
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    console.log('🔍 Profile ownership verified, proceeding with applications lookup');
    console.log('🔍 Looking for applications with profile_id:', profile.id, 'or user_id:', userId);

    // Get applications - use both applicant_profile_id and applicant_user_id for robustness
    const { data: applications, error: applicationsError } = await supabase
      .from('job_applications')
      .select('*')
      .or(`applicant_profile_id.eq.${profile.id},applicant_user_id.eq.${userId}`)
      .order('created_at', { ascending: false });

    if (applicationsError) {
      console.error('Applications fetch error:', applicationsError);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    console.log('🔍 Found applications:', applications?.length || 0);
    
    // Debug: Log each application to see what we found
    if (applications && applications.length > 0) {
      console.log('🔍 Application details:', applications.map(app => ({
        id: app.id,
        applicant_profile_id: app.applicant_profile_id,
        applicant_user_id: app.applicant_user_id,
        job_id: app.job_id,
        status: app.status
      })));
    }

    // Get job details for each application
    const applicationsWithJobs = await Promise.all(
      (applications || []).map(async (app) => {
        console.log('🔍 Fetching job details for application:', app.id, 'job_id:', app.job_id);
        
        // Get job details first
        const { data: job, error: jobError } = await supabase
          .from('jobs')
          .select('id, title, payout_type, payout_fixed, payout_min, payout_max, created_by')
          .eq('id', app.job_id)
          .single();

        console.log('🔍 Job query result:', { job, jobError, jobId: app.job_id });

        if (jobError || !job) {
          console.warn(`Failed to fetch job ${app.job_id} for application ${app.id}:`, jobError);
          return {
            id: app.id,
            cover_note: app.cover_note,
            proposed_rate: app.proposed_rate,
            proposed_payout_type: app.proposed_payout_type,
            proposed_timeline: app.proposed_timeline,
            status: app.status,
            created_at: app.created_at,
            notes: app.notes,
            job: {
              id: app.job_id,
              title: 'Job not found',
              firm_name: 'Unknown',
              payout_type: null,
              payout_fixed: null,
              payout_min: null,
              payout_max: null,
            }
          };
        }

        // Get firm name from the job creator's profile
        let firmName = 'Unknown Firm';
        if (job.created_by) {
          try {
            const { data: firmProfile, error: firmError } = await supabase
              .from('profiles')
              .select('firm_name')
              .eq('clerk_id', job.created_by)
              .single();
            
            if (firmProfile && firmProfile.firm_name) {
              firmName = firmProfile.firm_name;
            }
          } catch (firmError) {
            console.log('🔍 Could not fetch firm name for job creator:', job.created_by);
          }
        }

        console.log('🔍 Successfully fetched job:', job.title, 'for application:', app.id, 'firm:', firmName);

        return {
          id: app.id,
          cover_note: app.cover_note,
          proposed_rate: app.proposed_rate,
          proposed_payout_type: app.proposed_payout_type,
          proposed_timeline: app.proposed_timeline,
          status: app.status,
          created_at: app.created_at,
          notes: app.notes,
          job: {
            id: job.id,
            title: job.title,
            firm_name: firmName,
            payout_type: job.payout_type,
            payout_fixed: job.payout_fixed,
            payout_min: job.payout_min,
            payout_max: job.payout_max,
          }
        };
      })
    );

    return NextResponse.json({ 
      applications: applicationsWithJobs 
    });
  } catch (error) {
    console.error('Profile applications error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
