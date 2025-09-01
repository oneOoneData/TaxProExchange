import { NextResponse } from 'next/server';
import { sendEmail } from '@/lib/email';

export const dynamic = 'force-dynamic';

interface ApplicationStatusChangeRequest {
  application_id: string;
  job_title: string;
  new_status: 'applied' | 'shortlisted' | 'hired' | 'withdrawn' | 'rejected' | 'completed';
  applicant_email: string;
  applicant_name: string;
  notes?: string;
}

// POST /api/notify/application-status-changed - Send notification when application status changes
export async function POST(request: Request) {
  try {
    // Verify webhook secret
    const webhookSecret = request.headers.get('X-Webhook-Secret');
    if (webhookSecret !== process.env.WEBHOOK_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: ApplicationStatusChangeRequest = await request.json();
    const { 
      application_id, 
      job_title, 
      new_status, 
      applicant_email, 
      applicant_name,
      notes 
    } = body;

    if (!application_id || !job_title || !new_status || !applicant_email || !applicant_name) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Format status for display
    const statusDisplay = {
      'applied': 'Application Received',
      'shortlisted': 'Shortlisted',
      'hired': 'Hired',
      'withdrawn': 'Withdrawn',
      'rejected': 'Not Selected',
      'completed': 'Completed'
    }[new_status] || new_status;

    // Create email content
    const subject = `Your application for "${job_title}" - ${statusDisplay}`;
    
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1f2937;">Application Status Update</h2>
        
        <p>Hello ${applicant_name},</p>
        
        <p>Your application for the position <strong>"${job_title}"</strong> has been updated.</p>
        
        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #374151;">New Status: ${statusDisplay}</h3>
          ${notes ? `<p><strong>Notes:</strong> ${notes}</p>` : ''}
        </div>
        
        <p>You can view your application details and any additional information in your TaxProExchange dashboard.</p>
        
        <div style="margin: 30px 0;">
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/profile/applications" 
             style="background-color: #1f2937; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            View My Applications
          </a>
        </div>
        
        <p>If you have any questions, please don't hesitate to reach out.</p>
        
        <p>Best regards,<br>The TaxProExchange Team</p>
        
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
        <p style="font-size: 12px; color: #6b7280;">
          This is an automated notification from TaxProExchange. 
          Please do not reply to this email.
        </p>
      </div>
    `;

    const textContent = `
Application Status Update

Hello ${applicant_name},

Your application for the position "${job_title}" has been updated.

New Status: ${statusDisplay}
${notes ? `Notes: ${notes}` : ''}

You can view your application details and any additional information in your TaxProExchange dashboard.

View My Applications: ${process.env.NEXT_PUBLIC_APP_URL}/profile/applications

If you have any questions, please don't hesitate to reach out.

Best regards,
The TaxProExchange Team

---
This is an automated notification from TaxProExchange. Please do not reply to this email.
    `;

    // Send email
    try {
      await sendEmail({
        to: applicant_email,
        subject,
        html: htmlContent,
        text: textContent
      });
      
      console.log(`Application status notification sent to ${applicant_email}`);
      return NextResponse.json({ 
        message: 'Notification sent successfully',
        recipient: applicant_email,
        status: new_status
      });
    } catch (emailError) {
      console.error('Failed to send application status notification:', emailError);
      return NextResponse.json({ 
        error: 'Failed to send notification',
        details: emailError instanceof Error ? emailError.message : 'Unknown error'
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Application status notification error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
