import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendEmail } from '@/lib/email';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(request: Request) {
  try {
    const { applicationId, newStatus, jobTitle, applicantEmail, applicantName } = await request.json();

    if (!applicationId || !newStatus || !jobTitle || !applicantEmail || !applicantName) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get application details
    const { data: application, error: appError } = await supabase
      .from('job_applications')
      .select(`
        id,
        status,
        job:jobs(
          id,
          title,
          firm_name
        ),
        applicant:profiles!job_applications_applicant_profile_id_fkey(
          id,
          first_name,
          last_name,
          public_email
        )
      `)
      .eq('id', applicationId)
      .single();

    if (appError || !application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    // Prepare email content based on status
    const statusMessages = {
      shortlisted: {
        subject: `Great news! You've been shortlisted for ${jobTitle}`,
        content: `
          <h2>Congratulations!</h2>
          <p>Dear ${applicantName},</p>
          <p>We're excited to let you know that your application for <strong>${jobTitle}</strong> has been shortlisted!</p>
          <p>This means you're one of our top candidates and we'd like to learn more about you.</p>
          <p>We'll be in touch soon with next steps.</p>
          <p>Best regards,<br>The TaxProExchange Team</p>
        `
      },
      hired: {
        subject: `🎉 Congratulations! You've been hired for ${jobTitle}`,
        content: `
          <h2>Welcome to the team!</h2>
          <p>Dear ${applicantName},</p>
          <p>We're thrilled to offer you the position for <strong>${jobTitle}</strong>!</p>
          <p>Your application stood out among many, and we're confident you'll be a great addition to our team.</p>
          <p>We'll be in touch shortly with details about next steps and getting started.</p>
          <p>Congratulations again!<br>The TaxProExchange Team</p>
        `
      },
      rejected: {
        subject: `Update on your application for ${jobTitle}`,
        content: `
          <h2>Thank you for your interest</h2>
          <p>Dear ${applicantName},</p>
          <p>Thank you for applying for <strong>${jobTitle}</strong>. After careful consideration, we've decided to move forward with other candidates at this time.</p>
          <p>We were impressed by your qualifications and encourage you to apply for other opportunities that match your skills.</p>
          <p>Best of luck with your job search!<br>The TaxProExchange Team</p>
        `
      }
    };

    const emailContent = statusMessages[newStatus as keyof typeof statusMessages];
    if (!emailContent) {
      return NextResponse.json({ error: 'Invalid status for email notification' }, { status: 400 });
    }

    // Send email notification
    try {
      await sendEmail({
        to: applicantEmail,
        subject: emailContent.subject,
        html: emailContent.content
      });

      console.log(`Application status email sent to ${applicantEmail} for status: ${newStatus}`);
    } catch (emailError) {
      console.error('Error sending application status email:', emailError);
      // Don't fail the request if email fails
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error in /api/notifications/application-status-updated:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
