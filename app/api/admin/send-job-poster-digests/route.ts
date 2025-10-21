import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseService } from '@/lib/supabaseService';
import { sendEmail } from '@/lib/email';

export const dynamic = 'force-dynamic';

// Helper function to get user email from Clerk ID
async function getUserEmailFromClerk(clerkId: string): Promise<string | null> {
  try {
    const response = await fetch(`https://api.clerk.com/v1/users/${clerkId}`, {
      headers: {
        'Authorization': `Bearer ${process.env.CLERK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      const user = await response.json();
      return user.email_addresses?.[0]?.email_address || null;
    }
    return null;
  } catch (error) {
    console.error(`Error fetching user ${clerkId} from Clerk:`, error);
    return null;
  }
}

function getDaysOpen(createdAt: string): number {
  const created = new Date(createdAt);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - created.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

function formatDaysOpen(days: number): string {
  if (days === 0) return 'Less than 1 day';
  if (days === 1) return '1 day';
  return `${days} days`;
}

// Helper to delay between emails to respect Resend rate limit (2 emails/sec)
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function POST(request: NextRequest) {
  try {
    // Verify admin access
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const supabase = supabaseService();
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('clerk_id', userId)
      .single();

    if (!profile?.is_admin) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    const { testMode = false, testEmail, specificJobId } = await request.json();

    console.log('📧 Sending job poster digests:', { testMode, testEmail, specificJobId });

    // Get all open jobs with their applications
    let jobsQuery = supabase
      .from('jobs')
      .select(`
        id,
        title,
        created_at,
        created_by,
        status,
        deadline_date,
        profiles!jobs_created_by_fkey(
          firm_name
        )
      `)
      .eq('status', 'open')
      .order('created_at', { ascending: false });

    if (specificJobId) {
      jobsQuery = jobsQuery.eq('id', specificJobId);
    }

    const { data: jobs, error: jobsError } = await jobsQuery;

    if (jobsError) {
      console.error('❌ Error fetching jobs:', jobsError);
      return NextResponse.json(
        { error: 'Failed to fetch jobs' },
        { status: 500 }
      );
    }

    if (!jobs || jobs.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No open jobs found',
        emailsSent: 0
      });
    }

    // Get applications for all jobs
    const jobIds = jobs.map(j => j.id);
    const { data: applications, error: appsError } = await supabase
      .from('job_applications')
      .select(`
        id,
        job_id,
        status,
        created_at,
        applicant_profile_id,
        proposed_rate,
        proposed_timeline,
        cover_note,
        profiles!job_applications_applicant_profile_id_fkey(
          first_name,
          last_name,
          headline
        )
      `)
      .in('job_id', jobIds)
      .order('created_at', { ascending: false });

    if (appsError) {
      console.error('❌ Error fetching applications:', appsError);
      return NextResponse.json(
        { error: 'Failed to fetch applications' },
        { status: 500 }
      );
    }

    // Group applications by job
    const applicationsByJob = new Map<string, any[]>();
    applications?.forEach(app => {
      if (!applicationsByJob.has(app.job_id)) {
        applicationsByJob.set(app.job_id, []);
      }
      applicationsByJob.get(app.job_id)!.push(app);
    });

    // Send digest to each job poster
    let emailsSent = 0;
    const errors: string[] = [];

    for (const job of jobs) {
      const jobApplications = applicationsByJob.get(job.id) || [];
      
      // Skip jobs with no applications
      if (jobApplications.length === 0) {
        console.log(`⏭️ Skipping job ${job.id} - no applications`);
        continue;
      }

      // Get job poster email
      let posterEmail: string | null = null;
      
      if (testMode && testEmail) {
        posterEmail = testEmail;
      } else {
        posterEmail = await getUserEmailFromClerk(job.created_by);
      }

      if (!posterEmail) {
        console.log(`⚠️ No email found for job poster ${job.created_by}`);
        errors.push(`No email for job: ${job.title}`);
        continue;
      }

      // Get poster profile for name
      const { data: posterProfile } = await supabase
        .from('profiles')
        .select('first_name, last_name')
        .eq('clerk_id', job.created_by)
        .single();

      const posterName = posterProfile 
        ? `${posterProfile.first_name} ${posterProfile.last_name}`
        : 'there';

      const daysOpen = getDaysOpen(job.created_at);
      
      // Count applications by status
      const statusCounts = {
        applied: jobApplications.filter(a => a.status === 'applied').length,
        shortlisted: jobApplications.filter(a => a.status === 'shortlisted').length,
        hired: jobApplications.filter(a => a.status === 'hired').length,
        rejected: jobApplications.filter(a => a.status === 'rejected').length,
      };

      // Create email content
      const subject = `Job Update: ${jobApplications.length} application${jobApplications.length !== 1 ? 's' : ''} for "${job.title}"`;

      const htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1f2937;">Job Posting Update</h2>
          
          <p>Hello ${posterName},</p>
          
          <p>Here's an update on your job posting:</p>
          
          <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin: 0 0 10px 0; color: #1f2937;">${job.title}</h3>
            <p style="margin: 5px 0; color: #6b7280;">
              <strong>Posted:</strong> ${formatDaysOpen(daysOpen)} ago
            </p>
            ${job.deadline_date ? `<p style="margin: 5px 0; color: #6b7280;">
              <strong>Deadline:</strong> ${new Date(job.deadline_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>` : ''}
          </div>
          
          <h3 style="color: #1f2937; margin-top: 30px;">Application Summary</h3>
          <div style="background-color: #ecfdf5; border-left: 4px solid #10b981; padding: 15px; margin: 15px 0;">
            <p style="margin: 5px 0; font-size: 18px;"><strong>${jobApplications.length}</strong> total application${jobApplications.length !== 1 ? 's' : ''}</p>
            <ul style="margin: 10px 0; padding-left: 20px;">
              ${statusCounts.applied > 0 ? `<li><strong>${statusCounts.applied}</strong> new application${statusCounts.applied !== 1 ? 's' : ''}</li>` : ''}
              ${statusCounts.shortlisted > 0 ? `<li><strong>${statusCounts.shortlisted}</strong> shortlisted</li>` : ''}
              ${statusCounts.hired > 0 ? `<li><strong>${statusCounts.hired}</strong> hired</li>` : ''}
              ${statusCounts.rejected > 0 ? `<li><strong>${statusCounts.rejected}</strong> rejected</li>` : ''}
            </ul>
          </div>

          ${statusCounts.applied > 0 ? `
            <h3 style="color: #1f2937; margin-top: 30px;">Recent Applicants</h3>
            ${jobApplications.filter(a => a.status === 'applied').slice(0, 3).map(app => `
              <div style="background-color: #f3f4f6; padding: 15px; border-radius: 6px; margin: 10px 0;">
                <p style="margin: 0 0 5px 0;"><strong>${app.profiles?.first_name} ${app.profiles?.last_name}</strong></p>
                ${app.profiles?.headline ? `<p style="margin: 0 0 5px 0; color: #6b7280; font-size: 14px;">${app.profiles.headline}</p>` : ''}
                ${app.proposed_rate ? `<p style="margin: 0 0 5px 0; color: #6b7280; font-size: 14px;">Proposed Rate: $${app.proposed_rate}${app.proposed_timeline ? ` (${app.proposed_timeline})` : ''}</p>` : ''}
                ${app.cover_note ? `<p style="margin: 5px 0 0 0; font-size: 14px; font-style: italic;">"${app.cover_note.substring(0, 150)}${app.cover_note.length > 150 ? '...' : ''}"</p>` : ''}
              </div>
            `).join('')}
            ${jobApplications.filter(a => a.status === 'applied').length > 3 ? `
              <p style="margin: 10px 0; color: #6b7280; font-size: 14px;">
                + ${jobApplications.filter(a => a.status === 'applied').length - 3} more applicant${jobApplications.filter(a => a.status === 'applied').length - 3 !== 1 ? 's' : ''}
              </p>
            ` : ''}
          ` : ''}
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/jobs/${job.id}/applications" 
               style="background-color: #1f2937; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Review All Applications
            </a>
          </div>
          
          <p>Keep your applicants informed by updating their status regularly. This helps maintain engagement and professionalism.</p>
          
          <p>Best regards,<br>The TaxProExchange Team</p>
          
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
          <p style="font-size: 12px; color: #6b7280;">
            This is an automated digest from TaxProExchange. 
            ${testMode ? '<strong>TEST MODE - This is a test email.</strong>' : 'Please do not reply to this email.'}
          </p>
        </div>
      `;

      const textContent = `
Job Posting Update

Hello ${posterName},

Here's an update on your job posting:

${job.title}
Posted: ${formatDaysOpen(daysOpen)} ago
${job.deadline_date ? `Deadline: ${new Date(job.deadline_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}` : ''}

Application Summary:
- ${jobApplications.length} total application${jobApplications.length !== 1 ? 's' : ''}
${statusCounts.applied > 0 ? `- ${statusCounts.applied} new application${statusCounts.applied !== 1 ? 's' : ''}` : ''}
${statusCounts.shortlisted > 0 ? `- ${statusCounts.shortlisted} shortlisted` : ''}
${statusCounts.hired > 0 ? `- ${statusCounts.hired} hired` : ''}
${statusCounts.rejected > 0 ? `- ${statusCounts.rejected} rejected` : ''}

${statusCounts.applied > 0 ? `
Recent Applicants:
${jobApplications.filter(a => a.status === 'applied').slice(0, 3).map(app => `
- ${app.profiles?.first_name} ${app.profiles?.last_name}
  ${app.profiles?.headline || ''}
  ${app.proposed_rate ? `Proposed Rate: $${app.proposed_rate}${app.proposed_timeline ? ` (${app.proposed_timeline})` : ''}` : ''}
  ${app.cover_note ? `"${app.cover_note.substring(0, 150)}${app.cover_note.length > 150 ? '...' : ''}"` : ''}
`).join('\n')}
${jobApplications.filter(a => a.status === 'applied').length > 3 ? `+ ${jobApplications.filter(a => a.status === 'applied').length - 3} more applicant${jobApplications.filter(a => a.status === 'applied').length - 3 !== 1 ? 's' : ''}` : ''}
` : ''}

Review All Applications: ${process.env.NEXT_PUBLIC_APP_URL}/jobs/${job.id}/applications

Keep your applicants informed by updating their status regularly. This helps maintain engagement and professionalism.

Best regards,
The TaxProExchange Team

---
This is an automated digest from TaxProExchange.
${testMode ? 'TEST MODE - This is a test email.' : 'Please do not reply to this email.'}
      `;

      // Send email
      try {
        await sendEmail({
          to: posterEmail,
          subject,
          html: htmlContent,
          text: textContent
        });
        
        console.log(`✅ Job poster digest sent to ${posterEmail} for job ${job.id}`);
        emailsSent++;
        
        // Rate limit: Resend allows 2 emails/sec, so wait 600ms between sends
        // This keeps us at ~1.67 emails/sec to be safe
        await delay(600);
      } catch (emailError) {
        console.error(`❌ Failed to send email to ${posterEmail}:`, emailError);
        errors.push(`Failed to send email for job: ${job.title}`);
      }
    }

    return NextResponse.json({ 
      success: true,
      message: `Job poster digests sent successfully`,
      emailsSent,
      totalJobs: jobs.length,
      errors: errors.length > 0 ? errors : undefined,
      testMode
    });

  } catch (error) {
    console.error('❌ Job poster digest error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

