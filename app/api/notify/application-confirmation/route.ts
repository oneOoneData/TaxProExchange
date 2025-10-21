import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendEmail } from '@/lib/email';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      job_id,
      job_title,
      firm_name,
      applicant_name,
      applicant_clerk_id,
      cover_note,
      proposed_rate,
      proposed_timeline
    } = body;

    if (!job_id || !job_title || !applicant_name || !applicant_clerk_id) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get job details
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .select('created_by, title, firm_name, deadline_date')
      .eq('id', job_id)
      .single();

    if (jobError || !job) {
      console.error('Failed to get job details:', jobError);
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    // Get applicant profile details for email preferences
    const { data: applicantProfile } = await supabase
      .from('profiles')
      .select('email_preferences')
      .eq('clerk_id', applicant_clerk_id)
      .single();

    // Check email preferences
    const emailPrefs = applicantProfile?.email_preferences || {};
    if (emailPrefs.application_updates === false) {
      return NextResponse.json({ 
        success: true, 
        message: 'Email notification skipped due to user preferences' 
      });
    }

    // Fetch real email from Clerk
    let applicantEmail = 'no-email@example.com';
    const realEmail = await getUserEmailFromClerk(applicant_clerk_id);
    if (realEmail) {
      applicantEmail = realEmail;
    }

    // Use the applicant_name passed in from the request
    const applicantName = applicant_name;

    // Create email content
    const subject = `Application submitted for "${job_title}"`;
    
    const formatProposedRate = () => {
      if (!proposed_rate) return 'Not specified';
      if (proposed_timeline) {
        return `$${proposed_rate} (${proposed_timeline})`;
      }
      return `$${proposed_rate}`;
    };

    const formatDeadline = (deadline: string) => {
      if (!deadline) return 'Not specified';
      return new Date(deadline).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    };

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1f2937;">Application Submitted Successfully</h2>
        
        <p>Hello ${applicantName},</p>
        
        <p>Your application has been successfully submitted for the following position:</p>
        
        <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin: 0 0 10px 0; color: #1f2937;">${job_title}</h3>
          <p style="margin: 5px 0; color: #6b7280; font-weight: 500;">${firm_name || 'Company not specified'}</p>
          <p style="margin: 5px 0; color: #6b7280;">Application Deadline: ${formatDeadline(job.deadline_date)}</p>
        </div>
        
        <h3 style="color: #1f2937; margin-top: 30px;">Your Application Details:</h3>
        <div style="background-color: #f3f4f6; padding: 15px; border-radius: 6px; margin: 15px 0;">
          <p style="margin: 5px 0;"><strong>Proposed Rate:</strong> ${formatProposedRate()}</p>
          ${cover_note ? `<p style="margin: 10px 0 5px 0;"><strong>Cover Note:</strong></p><p style="margin: 5px 0; font-style: italic;">"${cover_note}"</p>` : ''}
        </div>
        
        <div style="background-color: #ecfdf5; border-left: 4px solid #10b981; padding: 15px; margin: 20px 0;">
          <h4 style="margin: 0 0 10px 0; color: #065f46;">What happens next?</h4>
          <ul style="margin: 0; padding-left: 20px; color: #047857;">
            <li>The job poster will review your application</li>
            <li>You'll receive an email notification when your status changes</li>
            <li>If accepted, you can start messaging the job poster directly</li>
            <li>You can track all your applications in your dashboard</li>
          </ul>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/profile/applications" 
             style="background-color: #1f2937; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            View My Applications
          </a>
        </div>
        
        <p>Thank you for using TaxProExchange. We wish you the best of luck with your application!</p>
        
        <p>Best regards,<br>The TaxProExchange Team</p>
        
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
        <p style="font-size: 12px; color: #6b7280;">
          This is an automated notification from TaxProExchange. 
          Please do not reply to this email.
        </p>
      </div>
    `;

    const textContent = `
Application Submitted Successfully

Hello ${applicantName},

Your application has been successfully submitted for the following position:

${job_title}
${firm_name || 'Company not specified'}
Application Deadline: ${formatDeadline(job.deadline_date)}

Your Application Details:
- Proposed Rate: ${formatProposedRate()}
${cover_note ? `- Cover Note: "${cover_note}"` : ''}

What happens next?
- The job poster will review your application
- You'll receive an email notification when your status changes
- If accepted, you can start messaging the job poster directly
- You can track all your applications in your dashboard

View My Applications: ${process.env.NEXT_PUBLIC_APP_URL}/profile/applications

Thank you for using TaxProExchange. We wish you the best of luck with your application!

Best regards,
The TaxProExchange Team

---
This is an automated notification from TaxProExchange. Please do not reply to this email.
    `;

    // Send email
    try {
      await sendEmail({
        to: applicantEmail,
        subject,
        html: htmlContent,
        text: textContent
      });
      
      console.log(`Application confirmation sent to ${applicantEmail}`);
    } catch (emailError) {
      console.error('Failed to send application confirmation:', emailError);
      return NextResponse.json(
        { error: 'Failed to send confirmation email' },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Application confirmation sent successfully' 
    });

  } catch (error) {
    console.error('Application confirmation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
