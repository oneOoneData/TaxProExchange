import { NextResponse } from 'next/server';
import { supabaseService } from '@/lib/supabaseService';

export const dynamic = 'force-dynamic';

// GET /api/test/job-notifications - Test job notification system
export async function GET() {
  try {
    const supabase = supabaseService();

    // Get a sample job
    const { data: jobs, error: jobsError } = await supabase
      .from('jobs')
      .select('*')
      .limit(1);

    if (jobsError || !jobs || jobs.length === 0) {
      return NextResponse.json({ 
        error: 'No jobs found to test with',
        message: 'Create a job first to test notifications'
      }, { status: 404 });
    }

    const job = jobs[0];

    // Get users with job notifications enabled
    const { data: users, error: usersError } = await supabase
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
      .not('public_email', 'is', null)
      .limit(5); // Limit to 5 for testing

    if (usersError) {
      return NextResponse.json({ 
        error: 'Failed to fetch users',
        details: usersError
      }, { status: 500 });
    }

    return NextResponse.json({
      message: 'Job notification test data',
      job: {
        id: job.id,
        title: job.title,
        created_at: job.created_at
      },
      eligibleUsers: users?.map(user => ({
        name: `${user.first_name} ${user.last_name}`,
        email: user.public_email,
        job_notifications_enabled: user.email_preferences?.job_notifications
      })) || [],
      totalEligibleUsers: users?.length || 0,
      testEndpoint: `${process.env.NEXT_PUBLIC_APP_URL}/api/notify/job-created`,
      instructions: [
        '1. This shows users who would receive job notifications',
        '2. To test actual notifications, POST to the test endpoint with job_id',
        '3. Make sure WEBHOOK_SECRET is set in environment variables'
      ]
    });

  } catch (error) {
    console.error('Job notification test error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// POST /api/test/job-notifications - Trigger test notification
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { job_id } = body;

    if (!job_id) {
      return NextResponse.json({ 
        error: 'job_id required' 
      }, { status: 400 });
    }

    // Call the actual notification endpoint
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/notify/job-created`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Secret': process.env.WEBHOOK_SECRET || '',
      },
      body: JSON.stringify({ job_id }),
    });

    const result = await response.json();

    return NextResponse.json({
      message: 'Test notification triggered',
      job_id,
      notificationResult: result,
      status: response.status
    });

  } catch (error) {
    console.error('Test notification error:', error);
    return NextResponse.json({ 
      error: 'Failed to trigger test notification',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
