import { Resend } from 'resend';
import { verifiedListedHtml, verifiedListedText } from './verifiedListedTemplate';

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

export interface ConnectionRequestEmailData {
  requesterName: string;
  requesterFirm: string;
  requesterCredential: string;
  recipientName: string;
  recipientEmail: string;
  acceptLink: string;
}

export interface MessageNotificationEmailData {
  senderName: string;
  senderFirm: string;
  recipientName: string;
  recipientEmail: string;
  recipientProfileId: string;
  messagePreview: string;
  messageLink: string;
}

export interface VerifiedListedEmailData {
  firstName: string;
  profileUrl: string;
  foundingMemberUrl: string;
  shareLinkedInUrl: string;
  shareXUrl: string;
  inviteUrl: string;
  managePrefsUrl: string;
  year: number;
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
  message_notifications: boolean;
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
            <p>Or <a href="${process.env.NEXT_PUBLIC_APP_URL}/api/unsubscribe?email=${encodeURIComponent(data.recipientEmail)}&type=job_notifications" style="color: #4299e1;">click here to unsubscribe</a> from job notifications.</p>
            <p>TaxProExchange - Connecting verified tax professionals</p>
          </div>
        </body>
      </html>
    `,
    text: `New Job Opportunity: ${data.title}\n\nCompensation: ${data.payout}\nDeadline: ${data.deadline}\n\nView Job: ${data.link}\n\n---\nGot work to hand off or need a specialist?\n👉 Post a job on TaxProExchange: ${process.env.NEXT_PUBLIC_APP_URL}/jobs/new\n\n---\nYou're receiving this because you have job notifications enabled in your account settings.\n\nDon't want these emails? You can easily turn off job notifications:\n1. Go to your Settings page: ${process.env.NEXT_PUBLIC_APP_URL}/settings\n2. Scroll down to "Email Preferences"\n3. Uncheck "Job Notifications"\n4. Click "Save Preferences"\n\nOr click here to unsubscribe: ${process.env.NEXT_PUBLIC_APP_URL}/api/unsubscribe?email=${encodeURIComponent(data.recipientEmail)}&type=job_notifications\n\nTaxProExchange - Connecting verified tax professionals`
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
  }),

  connectionRequest: (data: ConnectionRequestEmailData): EmailTemplate => ({
    subject: `New Connection Request from ${data.requesterName}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>New Connection Request</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 8px; margin-bottom: 30px;">
            <h1 style="color: white; margin: 0; font-size: 24px; text-align: center;">New Connection Request</h1>
          </div>
          
          <div style="background: #f8f9fa; padding: 25px; border-radius: 8px; margin-bottom: 25px;">
            <h2 style="color: #2d3748; margin-top: 0; font-size: 20px;">${data.requesterName} wants to connect</h2>
            
            <div style="margin: 20px 0;">
              <strong>Professional:</strong> ${data.requesterName}<br>
              <strong>Firm:</strong> ${data.requesterFirm || 'Not specified'}<br>
              <strong>Credential:</strong> ${data.requesterCredential}
            </div>
            
            <p style="color: #4a5568; margin: 20px 0;">
              ${data.requesterName} has sent you a connection request on TaxProExchange. 
              Once you accept, you'll be able to message and collaborate with them.
            </p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${data.acceptLink}" style="background: #4299e1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500; display: inline-block;">View & Respond to Request</a>
          </div>
          
          <div style="border-top: 1px solid #e2e8f0; padding-top: 20px; margin-top: 30px; font-size: 14px; color: #718096;">
            <p>You're receiving this because you have connection request notifications enabled.</p>
            <p>TaxProExchange - Connecting verified tax professionals</p>
          </div>
        </body>
      </html>
    `,
    text: `New Connection Request from ${data.requesterName}\n\nProfessional: ${data.requesterName}\nFirm: ${data.requesterFirm || 'Not specified'}\nCredential: ${data.requesterCredential}\n\n${data.requesterName} has sent you a connection request on TaxProExchange. Once you accept, you'll be able to message and collaborate with them.\n\nView & Respond: ${data.acceptLink}`
  }),

  messageNotification: (data: MessageNotificationEmailData): EmailTemplate => ({
    subject: `New message from ${data.senderName}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>New Message</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; border-radius: 8px; margin-bottom: 30px;">
            <h1 style="color: white; margin: 0; font-size: 24px; text-align: center;">New Message</h1>
          </div>
          
          <div style="background: #f8f9fa; padding: 25px; border-radius: 8px; margin-bottom: 25px;">
            <h2 style="color: #2d3748; margin-top: 0; font-size: 20px;">Message from ${data.senderName}</h2>
            
            <div style="margin: 20px 0;">
              <strong>From:</strong> ${data.senderName}<br>
              <strong>Firm:</strong> ${data.senderFirm || 'Not specified'}
            </div>
            
            <div style="background: white; padding: 15px; border-radius: 6px; border-left: 4px solid #10b981; margin: 20px 0;">
              <p style="margin: 0; color: #4a5568; font-style: italic;">"${data.messagePreview}"</p>
            </div>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${data.messageLink}" style="background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500; display: inline-block;">View Message</a>
          </div>
          
          <div style="border-top: 1px solid #e2e8f0; padding-top: 20px; margin-top: 30px; font-size: 14px; color: #718096;">
            <p>You're receiving this because you have message notifications enabled. <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://taxproexchange.com'}/settings" style="color: #10b981; text-decoration: none;">Change your email preferences</a>.</p>
            <p style="margin: 10px 0;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://taxproexchange.com'}/api/unsubscribe?token=${data.recipientProfileId ? Buffer.from(data.recipientProfileId).toString('base64') : ''}&type=messages" style="color: #718096; text-decoration: underline;">Unsubscribe from message notifications</a> | 
              <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://taxproexchange.com'}/api/unsubscribe?token=${data.recipientProfileId ? Buffer.from(data.recipientProfileId).toString('base64') : ''}&type=all" style="color: #718096; text-decoration: underline;">Unsubscribe from all emails</a>
            </p>
            <p>TaxProExchange - Connecting verified tax professionals</p>
          </div>
        </body>
      </html>
    `,
    text: `New message from ${data.senderName}\n\nFrom: ${data.senderName}\nFirm: ${data.senderFirm || 'Not specified'}\n\nMessage: "${data.messagePreview}"\n\nView Message: ${data.messageLink}`
  })
};

type SendEmailArgs = {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  replyTo?: string;
  listUnsubscribe?: string; // mailto:… or https://…
  headers?: Record<string, string>; // Custom email headers
};

// Send email function
export async function sendEmail({
  to,
  subject,
  html,
  text,
  replyTo = process.env.EMAIL_REPLY_TO || 'support@taxproexchange.com',
  listUnsubscribe = `mailto:${process.env.EMAIL_REPLY_TO || 'support@taxproexchange.com'}?subject=unsubscribe`,
  headers: customHeaders = {},
}: SendEmailArgs) {
  try {
    const from = process.env.EMAIL_FROM || 'support@taxproexchange.com';
    const headers: Record<string, string> = {
      'List-Unsubscribe': listUnsubscribe,
      ...customHeaders,
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

// Send connection request notification
export async function sendConnectionRequestNotification(data: ConnectionRequestEmailData) {
  const template = emailTemplates.connectionRequest(data);
  return sendEmailLegacy(data.recipientEmail, template);
}

// Send message notification
export async function sendMessageNotification(data: MessageNotificationEmailData) {
  const template = emailTemplates.messageNotification(data);
  return sendEmailLegacy(data.recipientEmail, template);
}

// Send verified + listed notification
export async function sendVerifiedListedEmail(opts: {
  to: string;
  firstName: string | null;
  slug: string;
  managePrefsUrl?: string;
}) {
  const SITE_URL = process.env.SITE_URL || 'https://www.taxproexchange.com';
  const FOUNDING_MEMBER_URL = process.env.FOUNDING_MEMBER_URL || 'https://buymeacoffee.com/koenf';
  
  const profileUrl = `${SITE_URL}/p/${opts.slug}`;
  const shareLinkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(profileUrl)}`;
  const shareXUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent('I just got verified on TaxProExchange—open for connections & referrals.')}&url=${encodeURIComponent(profileUrl)}`;
  const inviteUrl = `${SITE_URL}/invite`;
  const managePrefsUrl = opts.managePrefsUrl || `${SITE_URL}/settings`;
  const year = new Date().getFullYear();

  const html = verifiedListedHtml({
    firstName: opts.firstName || '',
    profileUrl,
    foundingMemberUrl: FOUNDING_MEMBER_URL,
    shareLinkedInUrl,
    shareXUrl,
    inviteUrl,
    managePrefsUrl,
    siteUrl: SITE_URL,
    year
  });

  const text = verifiedListedText({
    firstName: opts.firstName || '',
    profileUrl,
    foundingMemberUrl: FOUNDING_MEMBER_URL,
    shareLinkedInUrl,
    shareXUrl,
    inviteUrl,
    managePrefsUrl,
    siteUrl: SITE_URL,
    year
  });

  return sendEmail({
    to: opts.to,
    subject: "You are verified and listed. Your profile is live",
    html,
    text,
    headers: {
      'List-Unsubscribe': `<mailto:support@taxproexchange.com?subject=unsubscribe>, <${managePrefsUrl}>`,
    },
  });
}
