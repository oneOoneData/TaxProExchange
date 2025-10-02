import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendEmail } from '@/lib/email';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.warn('Supabase environment variables not configured');
}

const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

export async function POST(request: NextRequest) {
  try {
    // Check if Supabase is configured
    if (!supabase) {
      console.log('❌ Supabase not configured');
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 503 }
      );
    }

    const { testMode = false, testEmail } = await request.json();

    console.log('📧 Sending weekly job digest:', { testMode, testEmail });

    // Get jobs from the last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const { data: recentJobs, error: jobsError } = await supabase
      .from('jobs')
      .select(`
        id,
        title,
        description,
        payout_type,
        payout_fixed,
        payout_min,
        payout_max,
        deadline_date,
        credentials_required,
        software_required,
        specialization_keys,
        created_at,
        created_by,
        profiles!jobs_created_by_fkey(
          first_name,
          last_name,
          firm_name
        )
      `)
      .gte('created_at', sevenDaysAgo.toISOString())
      .eq('status', 'open')
      .order('created_at', { ascending: false });

    if (jobsError) {
      console.error('❌ Error fetching recent jobs:', jobsError);
      return NextResponse.json(
        { error: 'Failed to fetch recent jobs' },
        { status: 500 }
      );
    }

    if (!recentJobs || recentJobs.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No recent jobs found to include in digest',
        jobsCount: 0,
        emailsSent: 0
      });
    }

    // Get users who want job notifications
    const { data: users, error: usersError } = await supabase
      .from('profiles')
      .select(`
        clerk_id,
        first_name,
        last_name,
        public_email,
        email_preferences
      `)
      .eq('email_preferences->job_notifications', true)
      .not('public_email', 'is', null);

    if (usersError) {
      console.error('❌ Error fetching users:', usersError);
      return NextResponse.json(
        { error: 'Failed to fetch users' },
        { status: 500 }
      );
    }

    if (!users || users.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No users found with job notifications enabled',
        jobsCount: recentJobs.length,
        emailsSent: 0
      });
    }

    // Prepare job digest content
    const jobsHtml = recentJobs.map(job => {
      const jobPoster = job.profiles && job.profiles.length > 0 ? `${job.profiles[0].first_name} ${job.profiles[0].last_name}` : 'Anonymous';
      const firmName = job.profiles && job.profiles.length > 0 && job.profiles[0].firm_name ? ` at ${job.profiles[0].firm_name}` : '';
      
      const formatPayout = () => {
        if (job.payout_type === 'fixed' && job.payout_fixed) {
          return `$${job.payout_fixed}`;
        } else if (job.payout_type === 'range' && job.payout_min && job.payout_max) {
          return `$${job.payout_min} - $${job.payout_max}`;
        } else if (job.payout_type === 'hourly' && job.payout_min) {
          return `$${job.payout_min}/hour`;
        }
        return 'To be discussed';
      };

      const formatDeadline = () => {
        if (!job.deadline_date) return 'No deadline specified';
        const deadline = new Date(job.deadline_date);
        return deadline.toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        });
      };

      const badges = [
        ...(job.credentials_required || []),
        ...(job.software_required || []),
        ...(job.specialization_keys || [])
      ].slice(0, 5);

      return `
        <div style="background: #f8f9fa; padding: 25px; border-radius: 8px; margin-bottom: 25px; border-left: 4px solid #667eea;">
          <h3 style="color: #2d3748; margin-top: 0; font-size: 18px;">${job.title}</h3>
          
          <div style="margin: 15px 0;">
            <strong>Posted by:</strong> ${jobPoster}${firmName}<br>
            <strong>Compensation:</strong> ${formatPayout()}<br>
            <strong>Deadline:</strong> ${formatDeadline()}
          </div>
          
          ${job.description ? `<p style="color: #4a5568; margin: 15px 0;">${job.description.substring(0, 200)}${job.description.length > 200 ? '...' : ''}</p>` : ''}
          
          ${badges.length > 0 ? `
            <div style="margin: 15px 0;">
              <strong>Requirements:</strong><br>
              ${badges.map(badge => `<span style="display: inline-block; background: #e2e8f0; color: #4a5568; padding: 4px 8px; border-radius: 4px; margin: 2px; font-size: 12px;">${badge}</span>`).join('')}
            </div>
          ` : ''}
          
          <div style="text-align: center; margin: 20px 0;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/jobs/${job.id}" style="background: #4299e1; color: white; padding: 8px 16px; text-decoration: none; border-radius: 6px; font-weight: 500; display: inline-block;">View Job Details</a>
          </div>
        </div>
      `;
    }).join('');

    const subject = `TaxProExchange Weekly Digest: ${recentJobs.length} New Job${recentJobs.length > 1 ? 's' : ''} This Week`;
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Weekly Job Digest</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 8px; margin-bottom: 30px;">
            <h1 style="color: white; margin: 0; font-size: 24px; text-align: center;">Weekly Job Digest</h1>
            <p style="color: white; margin: 10px 0 0 0; text-align: center; opacity: 0.9;">${recentJobs.length} new job${recentJobs.length > 1 ? 's' : ''} posted this week</p>
          </div>
          
          <div style="background: #f0f9ff; padding: 20px; border-radius: 8px; margin-bottom: 25px; border-left: 4px solid #0ea5e9;">
            <p style="margin: 0; color: #0c4a6e; font-weight: 500;">
              Here are the latest job opportunities posted on TaxProExchange this week. 
              Don't miss out on these great opportunities to grow your practice!
            </p>
          </div>
          
          ${jobsHtml}
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/jobs" style="background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500; display: inline-block;">View All Jobs</a>
          </div>
          
          <div style="background: #f0f9ff; padding: 20px; border-radius: 8px; margin: 30px 0; border-left: 4px solid #0ea5e9;">
            <p style="margin: 0; color: #0c4a6e; font-weight: 500;">
              Got work to hand off or need a specialist?<br>
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/jobs/new" style="color: #0ea5e9; text-decoration: none; font-weight: 600;">👉 Post a job on TaxProExchange</a>
            </p>
          </div>
          
          <div style="border-top: 1px solid #e2e8f0; padding-top: 20px; margin-top: 30px; font-size: 14px; color: #718096;">
            <p>You're receiving this because you have job notifications enabled in your account settings.</p>
            <p><strong>Don't want these emails?</strong> You can easily turn off job notifications:</p>
            <ul style="margin: 10px 0; padding-left: 20px;">
              <li>Go to your <a href="${process.env.NEXT_PUBLIC_APP_URL}/settings" style="color: #4299e1;">Settings page</a></li>
              <li>Scroll down to "Email Preferences"</li>
              <li>Uncheck "Job Notifications"</li>
              <li>Click "Save Preferences"</li>
            </ul>
            <p>TaxProExchange - Connecting verified tax professionals</p>
          </div>
        </body>
      </html>
    `;

    const textContent = `
TaxProExchange Weekly Digest: ${recentJobs.length} New Job${recentJobs.length > 1 ? 's' : ''} This Week

Here are the latest job opportunities posted on TaxProExchange this week:

${recentJobs.map(job => {
  const jobPoster = job.profiles && job.profiles.length > 0 ? `${job.profiles[0].first_name} ${job.profiles[0].last_name}` : 'Anonymous';
  const firmName = job.profiles && job.profiles.length > 0 && job.profiles[0].firm_name ? ` at ${job.profiles[0].firm_name}` : '';
  
  const formatPayout = () => {
    if (job.payout_type === 'fixed' && job.payout_fixed) {
      return `$${job.payout_fixed}`;
    } else if (job.payout_type === 'range' && job.payout_min && job.payout_max) {
      return `$${job.payout_min} - $${job.payout_max}`;
    } else if (job.payout_type === 'hourly' && job.payout_min) {
      return `$${job.payout_min}/hour`;
    }
    return 'To be discussed';
  };

  const formatDeadline = () => {
    if (!job.deadline_date) return 'No deadline specified';
    const deadline = new Date(job.deadline_date);
    return deadline.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  return `
${job.title}
Posted by: ${jobPoster}${firmName}
Compensation: ${formatPayout()}
Deadline: ${formatDeadline()}
${job.description ? `Description: ${job.description.substring(0, 200)}${job.description.length > 200 ? '...' : ''}` : ''}
View Job: ${process.env.NEXT_PUBLIC_APP_URL}/jobs/${job.id}

---`;
}).join('\n')}

View All Jobs: ${process.env.NEXT_PUBLIC_APP_URL}/jobs

Got work to hand off or need a specialist?
Post a job on TaxProExchange: ${process.env.NEXT_PUBLIC_APP_URL}/jobs/new

---

You're receiving this because you have job notifications enabled in your account settings.

Don't want these emails? You can easily turn off job notifications:
1. Go to your Settings page: ${process.env.NEXT_PUBLIC_APP_URL}/settings
2. Scroll down to "Email Preferences"
3. Uncheck "Job Notifications"
4. Click "Save Preferences"

TaxProExchange - Connecting verified tax professionals
    `;

    // Determine recipients
    const recipients = testMode && testEmail ? [{ public_email: testEmail, first_name: 'Test', last_name: 'User' }] : users;
    
    let emailsSent = 0;
    let emailsFailed = 0;
    const errors: string[] = [];

    // Send emails with rate limiting
    for (let i = 0; i < recipients.length; i++) {
      const user = recipients[i];
      
      try {
        await sendEmail({
          to: user.public_email,
          subject,
          html: htmlContent,
          text: textContent,
          replyTo: 'support@taxproexchange.com',
        });

        emailsSent++;
        console.log(`✅ Weekly digest sent to ${user.public_email}`);
      } catch (error) {
        emailsFailed++;
        const errorMessage = `Failed to send to ${user.public_email}: ${error instanceof Error ? error.message : 'Unknown error'}`;
        errors.push(errorMessage);
        console.error(`❌ ${errorMessage}`);
      }
      
      // Rate limiting: Wait 500ms between requests to stay under 2 req/sec limit
      if (i < recipients.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    return NextResponse.json({
      success: true,
      message: `Weekly digest processed successfully`,
      jobsCount: recentJobs.length,
      totalRecipients: recipients.length,
      emailsSent,
      emailsFailed,
      errors: errors.length > 0 ? errors : undefined,
      testMode
    });

  } catch (error) {
    console.error('❌ Send weekly digest error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
