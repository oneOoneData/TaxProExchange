import { NextResponse } from 'next/server';
import { supabaseService } from '@/lib/supabaseService';
import { sendBatchJobNotifications, JobCreatedEmailData } from '@/lib/email';

export const dynamic = 'force-dynamic';

// POST /api/notify/job-created - Send notifications for new job
export async function POST(request: Request) {
  try {
    // Verify webhook secret
    const webhookSecret = request.headers.get('X-Webhook-Secret');
    if (webhookSecret !== process.env.WEBHOOK_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { job_id } = body;

    if (!job_id) {
      return NextResponse.json({ error: 'job_id required' }, { status: 400 });
    }

    const supabase = supabaseService();

    // Get job details
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .select(`
        *,
        profiles!jobs_created_by_fkey(
          first_name,
          last_name,
          firm_name
        )
      `)
      .eq('id', job_id)
      .single();

    if (jobError || !job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    // Find users whose notification preferences match this job
    const { data: matchingUsers, error: usersError } = await supabase
      .from('profiles')
      .select(`
        clerk_id,
        first_name,
        last_name,
        public_email,
        email_preferences,
        works_international,
        countries
      `)
      .eq('email_preferences->job_notifications', true)
      .not('public_email', 'is', null);

    if (usersError) {
      console.error('Users fetch error:', usersError);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    // Filter users based on job requirements
    const eligibleUsers = matchingUsers?.filter(user => {
      // For now, we'll send to all users with job_notifications enabled
      // In the future, we can add more sophisticated filtering based on:
      // - User specializations
      // - Location preferences
      // - Payout preferences
      // - etc.
      
      return true;
    }) || [];

    // Prepare email notifications
    const notifications: JobCreatedEmailData[] = eligibleUsers
      .filter(user => user.public_email) // Only users with public emails
      .map(user => ({
        title: job.title,
        payout: formatPayout(job),
        deadline: formatDeadline(job.deadline_date),
        badges: [
          ...job.credentials_required,
          ...job.software_required,
          ...job.specialization_keys
        ].slice(0, 5), // Limit to 5 badges
        link: `${process.env.NEXT_PUBLIC_APP_URL}/jobs/${job.id}`,
        recipientEmail: user.public_email,
        recipientName: `${user.first_name} ${user.last_name}`
      }));

    // Send notifications
    const results = await sendBatchJobNotifications(notifications);

    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;

    console.log(`Job notifications sent: ${successCount} success, ${failureCount} failures`);

    return NextResponse.json({
      message: 'Notifications processed',
      total_users: eligibleUsers.length,
      notifications_sent: successCount,
      notifications_failed: failureCount,
      results
    });
  } catch (error) {
    console.error('Job notification error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Helper function to format payout display
function formatPayout(job: any): string {
  if (job.payout_type === 'fixed') {
    return `$${job.payout_fixed?.toLocaleString()}`;
  } else if (job.payout_type === 'hourly') {
    return `$${job.payout_min?.toLocaleString()}/hr - $${job.payout_max?.toLocaleString()}/hr`;
  } else if (job.payout_type === 'per_return') {
    return `$${job.payout_min?.toLocaleString()} - $${job.payout_max?.toLocaleString()} per return`;
  } else if (job.payout_type === 'discussed') {
    return 'To be discussed';
  }
  return 'Compensation not specified';
}

// Helper function to format deadline display
function formatDeadline(deadline: string | null): string {
  if (!deadline) return 'No deadline specified';
  
  const date = new Date(deadline);
  const today = new Date();
  const diffTime = date.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) return 'Deadline passed';
  if (diffDays === 0) return 'Due today';
  if (diffDays === 1) return 'Due tomorrow';
  if (diffDays <= 7) return `Due in ${diffDays} days`;
  if (diffDays <= 30) return `Due in ${Math.ceil(diffDays / 7)} weeks`;
  return `Due ${date.toLocaleDateString()}`;
}
