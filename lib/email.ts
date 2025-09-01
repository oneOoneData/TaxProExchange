import { Resend } from 'resend';

// Initialize Resend client
const resend = new Resend(process.env.RESEND_API_KEY);

export interface JobCreatedEmailData {
  title: string;
  payout: string;
  deadline: string;
  badges: string[];
  link: string;
  recipientEmail: string;
  recipientName: string;
}

export interface ProfileCompletionEmailData {
  profileId: string;
  firstName: string;
  lastName: string;
  email: string;
  credentialType: string;
  headline: string;
  firmName: string;
  adminViewLink: string;
}

export interface EmailTemplate {
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
}

// Email preference types
export interface EmailPreferences {
  job_notifications: boolean;
  application_updates: boolean;
  connection_requests: boolean;
  verification_emails: boolean;
  marketing_updates: boolean;
  frequency: 'immediate' | 'daily' | 'weekly' | 'never';
}

// Check if user should receive email based on preferences
export function shouldSendEmail(
  preferences: EmailPreferences | null,
  emailType: keyof EmailPreferences,
  isCritical: boolean = false
): boolean {
  // If no preferences set, default to sending (for existing users)
  if (!preferences) {
    return true;
  }

  // Critical emails (verification, application updates) always sent if enabled
  if (isCritical) {
    return preferences[emailType] === true;
  }

  // Check if this type of email is enabled
  return preferences[emailType] === true;
}

// Email templates
export const emailTemplates = {
  jobCreated: (data: JobCreatedEmailData): EmailTemplate => ({
    subject: `New TaxProExchange Job: ${data.title}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>New Job Opportunity</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 8px; margin-bottom: 30px;">
            <h1 style="color: white; margin: 0; font-size: 24px; text-align: center;">New Job Opportunity</h1>
          </div>
          
          <div style="background: #f8f9fa; padding: 25px; border-radius: 8px; margin-bottom: 25px;">
            <h2 style="color: #2d3748; margin-top: 0; font-size: 20px;">${data.title}</h2>
            
            <div style="margin: 20px 0;">
              <strong>Compensation:</strong> ${data.payout}<br>
              <strong>Deadline:</strong> ${data.deadline}
            </div>
            
            ${data.badges.length > 0 ? `
              <div style="margin: 20px 0;">
                <strong>Requirements:</strong><br>
                ${data.badges.map(badge => `<span style="display: inline-block; background: #e2e8f0; color: #4a5568; padding: 4px 8px; border-radius: 4px; margin: 2px; font-size: 12px;">${badge}</span>`).join('')}
              </div>
            ` : ''}
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${data.link}" style="background: #4299e1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500; display: inline-block;">View Job Details</a>
          </div>
          
          <div style="border-top: 1px solid #e2e8f0; padding-top: 20px; margin-top: 30px; font-size: 14px; color: #718096;">
            <p>You're receiving this because your notification preferences match this job's requirements.</p>
            <p>TaxProExchange - Connecting verified tax professionals</p>
          </div>
        </body>
      </html>
    `,
    text: `New Job Opportunity: ${data.title}\n\nCompensation: ${data.payout}\nDeadline: ${data.deadline}\n\nView Job: ${data.link}`
  }),

  profileCompletion: (data: ProfileCompletionEmailData): EmailTemplate => ({
    subject: `New Profile Ready for Verification: ${data.firstName} ${data.lastName}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>New Profile Ready for Verification</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; border-radius: 8px; margin-bottom: 30px;">
            <h1 style="color: white; margin: 0; font-size: 24px; text-align: center;">New Profile Ready for Verification</h1>
          </div>
          
          <div style="background: #f8f9fa; padding: 25px; border-radius: 8px; margin-bottom: 25px;">
            <h2 style="color: #2d3748; margin-top: 0; font-size: 20px;">${data.firstName} ${data.lastName}</h2>
            
            <div style="margin: 20px 0;">
              <strong>Email:</strong> ${data.email}<br>
              <strong>Credential Type:</strong> ${data.credentialType}<br>
              <strong>Headline:</strong> ${data.headline || 'Not specified'}<br>
              <strong>Firm:</strong> ${data.firmName || 'Not specified'}
            </div>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${data.adminViewLink}" style="background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500; display: inline-block;">Review & Verify Profile</a>
          </div>
          
          <div style="background: #fef3c7; padding: 20px; border-radius: 8px; border-left: 4px solid #f59e0b;">
            <p style="margin: 0; color: #92400e;">
              <strong>Action Required:</strong> This profile has completed onboarding and is ready for your review. 
              Click the button above to view their full profile and approve or reject their verification.
            </p>
          </div>
          
          <div style="border-top: 1px solid #e2e8f0; padding-top: 20px; margin-top: 30px; font-size: 14px; color: #718096;">
            <p>TaxProExchange Admin Notification</p>
            <p>This email was sent automatically when a user completed their profile setup.</p>
          </div>
        </body>
      </html>
    `,
    text: `New Profile Ready for Verification: ${data.firstName} ${data.lastName}\n\nEmail: ${data.email}\nCredential Type: ${data.credentialType}\nHeadline: ${data.headline || 'Not specified'}\nFirm: ${data.firmName || 'Not specified'}\n\nReview Profile: ${data.adminViewLink}\n\nAction Required: This profile has completed onboarding and is ready for your review.`
  })
};

type SendEmailArgs = {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  replyTo?: string;
  listUnsubscribe?: string; // mailto:… or https://…
};

// Send email function
export async function sendEmail({
  to,
  subject,
  html,
  text,
  replyTo = process.env.EMAIL_REPLY_TO || 'support@taxproexchange.com',
  listUnsubscribe = `mailto:${process.env.EMAIL_REPLY_TO || 'support@taxproexchange.com'}?subject=unsubscribe`,
}: SendEmailArgs) {
  try {
    const from = process.env.EMAIL_FROM || 'support@taxproexchange.com';
    const headers: Record<string, string> = {
      'List-Unsubscribe': listUnsubscribe,
    };

    const result = await resend.emails.send({
      from,
      to,
      subject,
      html,
      text,
      reply_to: replyTo,
      headers,
    } as any);

    if (result.error) {
      console.error('Resend email error:', result.error);
      throw new Error(`Resend error: ${result.error.message}`);
    }

    console.log('Email sent successfully:', result);
    return result;
  } catch (error) {
    console.error('Email service error:', error);
    throw error;
  }
}

// Legacy sendEmail function for backward compatibility
export async function sendEmailLegacy(to: string, template: EmailTemplate) {
  return sendEmail({
    to,
    subject: template.subject,
    html: template.html,
    text: template.text,
    replyTo: template.replyTo,
  });
}

// Send job created notification
export async function sendJobCreatedNotification(data: JobCreatedEmailData) {
  const template = emailTemplates.jobCreated(data);
  return sendEmailLegacy(data.recipientEmail, template);
}

// Batch send job notifications
export async function sendBatchJobNotifications(notifications: JobCreatedEmailData[]) {
  const results = [];
  
  for (const notification of notifications) {
    try {
      const result = await sendJobCreatedNotification(notification);
      results.push({ success: true, email: notification.recipientEmail, result });
    } catch (error) {
      console.error(`Failed to send notification to ${notification.recipientEmail}:`, error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      results.push({ success: false, email: notification.recipientEmail, error: errorMessage });
    }
  }
  
  return results;
}

// Send profile completion notification to admin
export async function sendProfileCompletionNotification(data: ProfileCompletionEmailData) {
  const adminEmail = process.env.ADMIN_EMAIL || 'koen@cardifftax.com';
  const template = emailTemplates.profileCompletion(data);
  return sendEmailLegacy(adminEmail, template);
}
