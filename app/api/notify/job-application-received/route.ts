import { NextRequest, NextResponse } from 'next/server';
import { supabaseService } from '@/lib/supabaseService';
import { sendEmail } from '@/lib/email';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Function to get user email from Clerk
async function getUserEmailFromClerk(clerkId: string): Promise<string | null> {
  try {
    const response = await fetch(`https://api.clerk.com/v1/users/${clerkId}`, {
      headers: {
        'Authorization': `Bearer ${process.env.CLERK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.warn(`Failed to fetch user ${clerkId} from Clerk:`, response.status);
      return null;
    }

    const userData = await response.json();
    
    // Extract email from the user data
    if (userData.primary_email_address_id && userData.email_addresses) {
      const primaryEmail = userData.email_addresses.find((e: any) => e.id === userData.primary_email_address_id);
      if (primaryEmail) {
        return primaryEmail.email_address;
      }
    }
    
    // Fallback to first email address
    if (userData.email_addresses && userData.email_addresses.length > 0) {
      return userData.email_addresses[0].email_address;
    }

    return null;
  } catch (error) {
    console.error(`Error fetching user ${clerkId} from Clerk:`, error);
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      job_id,
      applicant_name,
      applicant_headline,
      proposed_rate,
      proposed_timeline,
      cover_note
    } = body;

    if (!job_id || !applicant_name) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const supabase = supabaseService();

    // Get job details
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .select(`
        created_by, 
        title,
        profiles!jobs_created_by_fkey(firm_name)
      `)
      .eq('id', job_id)
      .single();

    if (jobError || !job) {
      console.error('Failed to get job details:', jobError);
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    // Get job poster profile details
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('first_name, last_name, clerk_id')
      .eq('clerk_id', job.created_by)
      .single();

    if (profileError || !profile) {
      console.error('Failed to get job poster profile:', profileError);
      return NextResponse.json({ error: 'Job poster profile not found' }, { status: 404 });
    }

    // Fetch real email from Clerk
    let jobPosterEmail = 'no-email@example.com';
    if (profile.clerk_id) {
      const realEmail = await getUserEmailFromClerk(profile.clerk_id);
      if (realEmail) {
        jobPosterEmail = realEmail;
      }
    }

    const jobPosterName = `${profile.first_name} ${profile.last_name}`;
    const job_title = job.title;

    // Create email content
    const subject = `New application for "${job_title}"`;
    
    const formatProposedRate = () => {
      if (!proposed_rate) return 'Not specified';
      if (proposed_timeline) {
        return `$${proposed_rate} (${proposed_timeline})`;
      }
      return `$${proposed_rate}`;
    };

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1f2937;">New Job Application Received</h2>
        
        <p>Hello ${jobPosterName},</p>
        
        <p>You've received a new application for your job posting <strong>"${job_title}"</strong>.</p>
        
        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #374151;">Applicant Details</h3>
          <p><strong>Name:</strong> ${applicant_name}</p>
          <p><strong>Professional Title:</strong> ${applicant_headline}</p>
          <p><strong>Proposed Rate:</strong> ${formatProposedRate()}</p>
        </div>
        
        <div style="background-color: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h4 style="margin-top: 0; color: #92400e;">Cover Note</h4>
          <p style="font-style: italic;">"${cover_note}"</p>
        </div>
        
        <p>You can review this application and manage all applications for this job in your TaxProExchange dashboard.</p>
        
        <div style="margin: 30px 0;">
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/jobs/${job_id}/applications" 
             style="background-color: #1f2937; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Review Application
          </a>
        </div>
        
        <p>Take action on this application to keep candidates informed about their status.</p>
        
        <p>Best regards,<br>The TaxProExchange Team</p>
        
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
        <p style="font-size: 12px; color: #6b7280;">
          This is an automated notification from TaxProExchange. 
          Please do not reply to this email.
        </p>
      </div>
    `;

    const textContent = `
New Job Application Received

Hello ${jobPosterName},

You've received a new application for your job posting "${job_title}".

Applicant Details:
- Name: ${applicant_name}
- Professional Title: ${applicant_headline}
- Proposed Rate: ${formatProposedRate()}

Cover Note:
"${cover_note}"

You can review this application and manage all applications for this job in your TaxProExchange dashboard.

Review Application: ${process.env.NEXT_PUBLIC_APP_URL}/jobs/${job_id}/applications

Take action on this application to keep candidates informed about their status.

Best regards,
The TaxProExchange Team

---
This is an automated notification from TaxProExchange. Please do not reply to this email.
    `;

    // Send email
    try {
      await sendEmail({
        to: jobPosterEmail,
        subject,
        html: htmlContent,
        text: textContent
      });
      
      console.log(`Job application notification sent to ${jobPosterEmail}`);
    } catch (emailError) {
      console.error('Failed to send email notification:', emailError);
      return NextResponse.json(
        { error: 'Failed to send notification email' },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Notification sent successfully' 
    });

  } catch (error) {
    console.error('Job application notification error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
