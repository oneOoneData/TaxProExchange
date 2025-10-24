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

// GET /api/notify-job-posters/debug - Debug endpoint to see what job posters would be notified
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

    // First, get all job IDs with pending applications
    const { data: jobIds, error: jobIdsError } = await supabase
      .from('job_applications')
      .select('job_id, status')
      .in('status', ['applied', 'pending']);

    if (jobIdsError) {
      console.error('Error fetching job IDs:', jobIdsError);
      return NextResponse.json(
        { error: 'Failed to fetch job IDs' },
        { status: 500 }
      );
    }

    // Get all job applications for context
    const { data: allApplications, error: allAppsError } = await supabase
      .from('job_applications')
      .select('id, job_id, status, created_at');

    // Get all jobs for context
    const { data: allJobs, error: allJobsError } = await supabase
      .from('jobs')
      .select('id, title, created_by, status');

    if (!jobIds || jobIds.length === 0) {
      return NextResponse.json({
        message: 'No jobs found with pending applications',
        debug: {
          totalApplications: allApplications?.length || 0,
          totalJobs: allJobs?.length || 0,
          applicationsByStatus: allApplications?.reduce((acc, app) => {
            acc[app.status] = (acc[app.status] || 0) + 1;
            return acc;
          }, {} as Record<string, number>) || {},
          jobsByStatus: allJobs?.reduce((acc, job) => {
            acc[job.status] = (acc[job.status] || 0) + 1;
            return acc;
          }, {} as Record<string, number>) || {}
        }
      });
    }

    // Extract unique job IDs
    const uniqueJobIds = Array.from(new Set(jobIds.map(job => job.job_id)));

    // Get all job posters who have jobs with pending applications
    const { data: jobPosters, error } = await supabase
      .from('jobs')
      .select(`
        id,
        title,
        created_by,
        status,
        profiles!jobs_created_by_fkey(
          first_name,
          last_name,
          email,
          public_email
        )
      `)
      .in('id', uniqueJobIds);

    if (error) {
      console.error('Error fetching job posters:', error);
      return NextResponse.json(
        { error: 'Failed to fetch job posters' },
        { status: 500 }
      );
    }

    // Check for recent notifications (last 24 hours)
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    
    const { data: recentNotifications, error: notificationsError } = await supabase
      .from('email_log')
      .select('recipients, sent_at')
      .eq('subject', 'You have new applicants waiting on TaxProExchange')
      .gte('sent_at', twentyFourHoursAgo);

    // Extract recent recipient emails
    const recentEmails = new Set();
    recentNotifications?.forEach(notification => {
      if (Array.isArray(notification.recipients)) {
        notification.recipients.forEach(email => recentEmails.add(email));
      }
    });

    // Analyze the data
    const analysis = {
      totalApplications: allApplications?.length || 0,
      totalJobs: allJobs?.length || 0,
      applicationsWithPendingStatus: jobIds.length,
      uniqueJobsWithPendingApplications: uniqueJobIds.length,
      jobPostersFound: jobPosters?.length || 0,
      applicationsByStatus: allApplications?.reduce((acc, app) => {
        acc[app.status] = (acc[app.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {},
      jobsByStatus: allJobs?.reduce((acc, job) => {
        acc[job.status] = (acc[job.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {},
      jobPostersWithValidData: 0,
      jobPostersWithoutEmail: 0,
      jobPostersWithoutPublicEmail: 0,
      jobPostersWithoutFirstName: 0,
      recentNotificationsCount: recentNotifications?.length || 0,
      recentRecipientsCount: recentEmails.size,
      recentRecipients: Array.from(recentEmails),
      jobPostersDetails: [] as any[]
    };

    // Analyze each job poster
    jobPosters?.forEach(job => {
      const profile = Array.isArray(job.profiles) ? job.profiles[0] : job.profiles;
      
      const posterInfo = {
        jobId: job.id,
        jobTitle: job.title,
        jobStatus: job.status,
        createdBy: job.created_by,
        hasEmail: !!profile?.email,
        hasPublicEmail: !!profile?.public_email,
        hasFirstName: !!profile?.first_name,
        email: profile?.email || 'No email',
        publicEmail: profile?.public_email || 'No public email',
        firstName: profile?.first_name || 'No first name',
        lastName: profile?.last_name || 'No last name',
        wouldReceiveNotification: !!(profile?.public_email && profile?.first_name && !recentEmails.has(profile.public_email)),
        recentlyNotified: recentEmails.has(profile?.public_email || '')
      };

      analysis.jobPostersDetails.push(posterInfo);

      if (profile?.public_email && profile?.first_name) {
        analysis.jobPostersWithValidData++;
      } else {
        if (!profile?.email) analysis.jobPostersWithoutEmail++;
        if (!profile?.public_email) analysis.jobPostersWithoutPublicEmail++;
        if (!profile?.first_name) analysis.jobPostersWithoutFirstName++;
      }
    });

    return NextResponse.json({
      message: 'Debug information for job poster notifications',
      analysis
    });

  } catch (error) {
    console.error('Debug job posters error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
