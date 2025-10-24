import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { auth } from '@clerk/nextjs/server';
import { sendJobPosterNotification } from '@/lib/email';

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

// POST /api/notify-job-posters - Send bulk notification to job posters with pending applications
export async function POST(request: NextRequest) {
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
      .select('job_id')
      .in('status', ['applied', 'pending']);

    if (jobIdsError) {
      console.error('Error fetching job IDs:', jobIdsError);
      return NextResponse.json(
        { error: 'Failed to fetch job IDs' },
        { status: 500 }
      );
    }

    if (!jobIds || jobIds.length === 0) {
      return NextResponse.json({
        message: 'No jobs found with pending applications',
        notificationsSent: 0,
        debug: {
          totalApplicationsFound: jobIds?.length || 0,
          statusesSearched: ['applied', 'pending']
        }
      });
    }

    // Extract unique job IDs
    const uniqueJobIds = Array.from(new Set(jobIds.map(job => job.job_id)));

    // Get all job posters who have jobs with pending applications
    const { data: jobPosters, error } = await supabase
      .from('jobs')
      .select(`
        created_by,
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

    if (!jobPosters || jobPosters.length === 0) {
      return NextResponse.json({
        message: 'No job posters found with pending applications',
        notificationsSent: 0,
        debug: {
          uniqueJobIdsFound: uniqueJobIds.length,
          jobPostersFound: jobPosters?.length || 0
        }
      });
    }

    // Remove duplicates and filter out users without email or first name
    const uniquePosters = new Map();
    jobPosters.forEach(job => {
      const profile = Array.isArray(job.profiles) ? job.profiles[0] : job.profiles;
      if (profile?.public_email && profile?.first_name && !uniquePosters.has(job.created_by)) {
        uniquePosters.set(job.created_by, {
          userId: job.created_by,
          firstName: profile.first_name,
          email: profile.public_email
        });
      }
    });

    // Check for recent notifications to avoid duplicates
    // Get notifications sent in the last 24 hours
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    
    const { data: recentNotifications, error: notificationsError } = await supabase
      .from('email_log')
      .select('recipients, sent_at')
      .eq('subject', 'You have new applicants waiting on TaxProExchange')
      .gte('sent_at', twentyFourHoursAgo);

    if (notificationsError) {
      console.warn('Could not check recent notifications:', notificationsError);
    }

    // Extract all recent recipient emails from the recipients array
    const recentEmails = new Set();
    recentNotifications?.forEach(notification => {
      if (Array.isArray(notification.recipients)) {
        notification.recipients.forEach(email => recentEmails.add(email));
      }
    });

    // Filter out users who received notifications in the last 24 hours
    const filteredPosters = new Map();
    
    uniquePosters.forEach((poster, userId) => {
      if (!recentEmails.has(poster.email)) {
        filteredPosters.set(userId, poster);
      }
    });

    const notificationsSent = [];
    const errors = [];

    // Send notifications to each unique job poster (excluding recent recipients)
    const postersArray = Array.from(filteredPosters.values());
    for (const poster of postersArray) {
      try {
        await sendJobPosterNotification({
          firstName: poster.firstName,
          email: poster.email,
          applicationsLink: 'https://www.taxproexchange.com/profile/applications'
        });
        
        // Log the email send to prevent duplicates
        await supabase
          .from('email_log')
          .insert({
            from_email: 'TaxProExchange <support@taxproexchange.com>',
            subject: 'You have new applicants waiting on TaxProExchange',
            recipients: [poster.email],
            emails_sent: 1,
            emails_failed: 0,
            sent_at: new Date().toISOString()
          });
        
        notificationsSent.push({
          userId: poster.userId,
          email: poster.email,
          success: true
        });
      } catch (error) {
        console.error(`Failed to send notification to ${poster.email}:`, error);
        errors.push({
          userId: poster.userId,
          email: poster.email,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return NextResponse.json({
      message: 'Job poster notifications sent',
      notificationsSent: notificationsSent.length,
      totalPosters: uniquePosters.size,
      filteredPosters: filteredPosters.size,
      skippedDueToRecentNotification: uniquePosters.size - filteredPosters.size,
      errors: errors.length,
      debug: {
        totalApplicationsFound: jobIds.length,
        uniqueJobIdsFound: uniqueJobIds.length,
        jobPostersFound: jobPosters.length,
        postersWithValidData: uniquePosters.size,
        postersSkipped: jobPosters.length - uniquePosters.size,
        recentNotificationsFound: recentNotifications?.length || 0
      },
      details: {
        sent: notificationsSent,
        failed: errors
      }
    });

  } catch (error) {
    console.error('Notify job posters error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
