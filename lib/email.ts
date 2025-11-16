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

export interface AdminEventsNotificationData {
  adminName: string;
  totalEvents: number;
  ingestedEvents: number;
  updatedEvents: number;
  validationResults: {
    processed: number;
    validated: number;
    publishable: number;
    errors: number;
  };
  reviewUrl: string;
  dateRange: {
    from: string;
    to: string;
  };
}

export interface ProfileCompletionEmailData {
  profileId: string;
  firstName: string;
  lastName: string;
  email: string;
  credentialType: string;
  ptin?: string;
  headline: string;
  firmName: string;
  isListed: boolean;
  visibilityState: string;
  adminViewLink: string;
  approveLink: string;
  rejectLink: string;
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

export interface BenchInvitationEmailData {
  professionalFirstName: string;
  professionalEmail: string;
  firmName: string;
  inviterName: string;
  customTitleOffer?: string;
  message?: string;
  acceptLink: string;
  declineLink: string;
  viewInvitationLink: string;
}

export interface JobPosterNotificationEmailData {
  firstName: string;
  email: string;
  applicationsLink: string;
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
              ${data.ptin ? `<strong>PTIN:</strong> ${data.ptin}<br>` : ''}
              <strong>Headline:</strong> ${data.headline || 'Not specified'}<br>
              <strong>Firm:</strong> ${data.firmName || 'Not specified'}<br>
              <strong>Profile Status:</strong> ${data.isListed ? 'Listed' : 'Not Listed'} | ${data.visibilityState.replace('_', ' ').toUpperCase()}
            </div>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${data.adminViewLink}" style="background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500; display: inline-block; margin-right: 10px;">Review Full Profile</a>
          </div>
          
          <div style="background: #f0f9ff; padding: 20px; border-radius: 8px; border-left: 4px solid #0ea5e9; margin-bottom: 20px;">
            <h3 style="margin: 0 0 15px 0; color: #0c4a6e; font-size: 16px;">Quick Actions</h3>
            <div style="text-align: center;">
              <a href="${data.approveLink}" style="background: #10b981; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: 500; display: inline-block; margin-right: 10px;">✓ Approve Profile</a>
              <a href="${data.rejectLink}" style="background: #dc2626; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: 500; display: inline-block;">✗ Reject Profile</a>
            </div>
            <p style="margin: 15px 0 0 0; color: #0c4a6e; font-size: 14px;">
              <strong>Note:</strong> These buttons will approve/reject the profile immediately. Use "Review Full Profile" for detailed review.
            </p>
          </div>
          
          <div style="background: #fef3c7; padding: 20px; border-radius: 8px; border-left: 4px solid #f59e0b;">
            <p style="margin: 0; color: #92400e;">
              <strong>Action Required:</strong> This profile has completed onboarding and is ready for your review. 
              You can approve/reject directly from this email or review the full profile first.
            </p>
          </div>
          
          <div style="border-top: 1px solid #e2e8f0; padding-top: 20px; margin-top: 30px; font-size: 14px; color: #718096;">
            <p>TaxProExchange Admin Notification</p>
            <p>This email was sent automatically when a user completed their profile setup.</p>
          </div>
        </body>
      </html>
    `,
    text: `New Profile Ready for Verification: ${data.firstName} ${data.lastName}\n\nEmail: ${data.email}\nCredential Type: ${data.credentialType}\n${data.ptin ? `PTIN: ${data.ptin}\n` : ''}Headline: ${data.headline || 'Not specified'}\nFirm: ${data.firmName || 'Not specified'}\nProfile Status: ${data.isListed ? 'Listed' : 'Not Listed'} | ${data.visibilityState.replace('_', ' ').toUpperCase()}\n\nReview Profile: ${data.adminViewLink}\n\nQuick Actions:\n- Approve: ${data.approveLink}\n- Reject: ${data.rejectLink}\n\nAction Required: This profile has completed onboarding and is ready for your review.`
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
  }),

  benchInvitation: (data: BenchInvitationEmailData): EmailTemplate => ({
    subject: `Team Invitation from ${data.firmName}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Team Invitation</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 8px; margin-bottom: 30px;">
            <h1 style="color: white; margin: 0; font-size: 24px; text-align: center;">🤝 Team Invitation</h1>
          </div>
          
          <div style="background: #f8f9fa; padding: 25px; border-radius: 8px; margin-bottom: 25px;">
            <h2 style="color: #2d3748; margin-top: 0; font-size: 20px;">Hi ${data.professionalFirstName}!</h2>
            
            <p style="color: #4a5568; font-size: 16px; margin: 20px 0;">
              <strong>${data.firmName}</strong> would like to add you to their extended team on TaxProExchange.
            </p>

            ${data.customTitleOffer ? `
              <div style="background: #e0e7ff; padding: 15px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #6366f1;">
                <p style="margin: 0; color: #312e81;">
                  <strong>Suggested Role:</strong> ${data.customTitleOffer}
                </p>
              </div>
            ` : ''}

            ${data.message ? `
              <div style="background: white; padding: 20px; border-radius: 6px; border-left: 4px solid #667eea; margin: 20px 0;">
                <p style="margin: 0; color: #4a5568; font-style: italic;">"${data.message}"</p>
                <p style="margin: 10px 0 0 0; color: #718096; font-size: 14px;">— ${data.inviterName}</p>
              </div>
            ` : ''}

            <div style="background: #f0f9ff; padding: 20px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #0ea5e9;">
              <p style="margin: 0; color: #0c4a6e; font-size: 14px;">
                <strong>What this means:</strong> By accepting, you'll be added to ${data.firmName}'s trusted bench. 
                They may reach out when they have overflow work or need your expertise. You're not committing to any specific work—just signaling you're open to opportunities from this firm.
              </p>
            </div>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${data.acceptLink}" style="background: #10b981; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block; margin-right: 10px; font-size: 16px;">✓ Accept Invitation</a>
            <a href="${data.declineLink}" style="background: #6b7280; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block; font-size: 16px;">Decline</a>
          </div>

          <div style="text-align: center; margin: 20px 0;">
            <a href="${data.viewInvitationLink}" style="color: #4299e1; text-decoration: none; font-size: 14px;">View full invitation details</a>
          </div>
          
          <div style="border-top: 1px solid #e2e8f0; padding-top: 20px; margin-top: 30px; font-size: 14px; color: #718096;">
            <p>You're receiving this because ${data.firmName} invited you to their extended team.</p>
            <p>TaxProExchange - Connecting verified tax professionals</p>
          </div>
        </body>
      </html>
    `,
    text: `Team Invitation from ${data.firmName}

Hi ${data.professionalFirstName}!

${data.firmName} would like to add you to their extended team on TaxProExchange.

${data.customTitleOffer ? `Suggested Role: ${data.customTitleOffer}\n\n` : ''}${data.message ? `Message from ${data.inviterName}:\n"${data.message}"\n\n` : ''}
What this means: By accepting, you'll be added to ${data.firmName}'s trusted bench. They may reach out when they have overflow work or need your expertise. You're not committing to any specific work—just signaling you're open to opportunities from this firm.

Accept Invitation: ${data.acceptLink}
Decline: ${data.declineLink}

View full details: ${data.viewInvitationLink}

---
You're receiving this because ${data.firmName} invited you to their extended team.
TaxProExchange - Connecting verified tax professionals`
  }),

  adminEventsNotification: (data: AdminEventsNotificationData): EmailTemplate => ({
    subject: `📅 Weekly Events Update - ${data.ingestedEvents} New Events Ready for Review`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Weekly Events Update</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 8px; margin-bottom: 30px;">
            <h1 style="color: white; margin: 0; font-size: 24px; text-align: center;">📅 Weekly Events Update</h1>
          </div>
          
          <div style="background: #f8f9fa; padding: 25px; border-radius: 8px; margin-bottom: 25px;">
            <h2 style="color: #2d3748; margin-top: 0; font-size: 20px;">Hello ${data.adminName}!</h2>
            
            <p style="margin: 15px 0; font-size: 16px;">
              The weekly events refresh has completed. Here's what was found:
            </p>
            
            <div style="background: white; padding: 20px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #667eea;">
              <h3 style="margin-top: 0; color: #2d3748;">📊 Summary</h3>
              <ul style="margin: 10px 0; padding-left: 20px;">
                <li><strong>Total Events Found:</strong> ${data.totalEvents}</li>
                <li><strong>New Events Added:</strong> ${data.ingestedEvents}</li>
                <li><strong>Events Updated:</strong> ${data.updatedEvents}</li>
                <li><strong>Date Range:</strong> ${data.dateRange.from} to ${data.dateRange.to}</li>
              </ul>
            </div>

            <div style="background: white; padding: 20px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #48bb78;">
              <h3 style="margin-top: 0; color: #2d3748;">🔍 Link Validation Results</h3>
              <ul style="margin: 10px 0; padding-left: 20px;">
                <li><strong>Events Processed:</strong> ${data.validationResults.processed}</li>
                <li><strong>Successfully Validated:</strong> ${data.validationResults.validated}</li>
                <li><strong>High Quality URLs:</strong> ${data.validationResults.publishable}</li>
                <li><strong>Validation Errors:</strong> ${data.validationResults.errors}</li>
              </ul>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${data.reviewUrl}" style="display: inline-block; background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">
                📋 Review Events Now
              </a>
            </div>
            
            <div style="background: #fff3cd; padding: 15px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #ffc107;">
              <p style="margin: 0; color: #856404; font-size: 14px;">
                <strong>💡 Reminder:</strong> Only events you approve will be shown to users. 
                Please review the URLs and event details before approving.
              </p>
            </div>
          </div>
          
          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0; color: #718096; font-size: 14px;">
            <p>This is an automated notification from TaxProExchange.</p>
            <p>Events are refreshed weekly on Mondays at 6 AM UTC.</p>
          </div>
        </body>
      </html>
    `,
    text: `
Weekly Events Update - ${data.ingestedEvents} New Events Ready for Review

Hello ${data.adminName}!

The weekly events refresh has completed. Here's what was found:

📊 Summary:
- Total Events Found: ${data.totalEvents}
- New Events Added: ${data.ingestedEvents}
- Events Updated: ${data.updatedEvents}
- Date Range: ${data.dateRange.from} to ${data.dateRange.to}

🔍 Link Validation Results:
- Events Processed: ${data.validationResults.processed}
- Successfully Validated: ${data.validationResults.validated}
- High Quality URLs: ${data.validationResults.publishable}
- Validation Errors: ${data.validationResults.errors}

📋 Review Events: ${data.reviewUrl}

💡 Reminder: Only events you approve will be shown to users. 
Please review the URLs and event details before approving.

This is an automated notification from TaxProExchange.
Events are refreshed weekly on Mondays at 6 AM UTC.
    `
  }),

  jobPosterNotification: (data: JobPosterNotificationEmailData): EmailTemplate => ({
    subject: 'You have new applicants waiting on TaxProExchange',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>New Applicants Waiting</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; border-radius: 8px; margin-bottom: 30px;">
            <h1 style="color: white; margin: 0; font-size: 24px; text-align: center;">New Applicants Waiting</h1>
          </div>
          
          <div style="background: #f8f9fa; padding: 25px; border-radius: 8px; margin-bottom: 25px;">
            <p style="color: #2d3748; font-size: 16px; margin: 0 0 20px 0;">
              Hi <strong>${data.firstName}</strong>,
            </p>
            
            <p style="color: #4a5568; font-size: 16px; margin: 20px 0;">
              You have one or more applicants waiting to be reviewed for your job postings on TaxProExchange.
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${data.applicationsLink}" style="background: #10b981; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block; font-size: 16px;">
                👉 View your applicants here
              </a>
            </div>
            
            <p style="color: #4a5568; font-size: 16px; margin: 20px 0;">
              We recommend checking in soon so you don't miss out on top talent in the network.
            </p>
            
            <p style="color: #4a5568; font-size: 16px; margin: 20px 0;">
              If you experience any issues, reach out to <strong>support@taxproexchange.com</strong> or click the 💡 icon inside the app to contact us directly.
            </p>
          </div>
          
          <div style="border-top: 1px solid #e2e8f0; padding-top: 20px; margin-top: 30px; font-size: 14px; color: #718096;">
            <p>Thank you for helping build a trusted exchange for tax professionals.</p>
            <p>– The TaxProExchange Team</p>
          </div>
        </body>
      </html>
    `,
    text: `You have new applicants waiting on TaxProExchange

Hi ${data.firstName},

You have one or more applicants waiting to be reviewed for your job postings on TaxProExchange.

👉 View your applicants here: ${data.applicationsLink}

We recommend checking in soon so you don't miss out on top talent in the network.

If you experience any issues, reach out to support@taxproexchange.com or click the 💡 icon inside the app to contact us directly.

Thank you for helping build a trusted exchange for tax professionals.

– The TaxProExchange Team`
  })
};

type SendEmailArgs = {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  replyTo?: string;
  from?: string; // Add from parameter
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
  from,
  listUnsubscribe = `mailto:${process.env.EMAIL_REPLY_TO || 'support@taxproexchange.com'}?subject=unsubscribe`,
  headers: customHeaders = {},
}: SendEmailArgs) {
  try {
    const fromAddress = from || process.env.EMAIL_FROM || 'TaxProExchange <support@taxproexchange.com>';
    const headers: Record<string, string> = {
      'List-Unsubscribe': listUnsubscribe,
      ...customHeaders,
    };

    const result = await resend.emails.send({
      from: fromAddress,
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

// Send admin events notification
export async function sendAdminEventsNotification(data: AdminEventsNotificationData & { email: string }) {
  const template = emailTemplates.adminEventsNotification(data);
  return sendEmailLegacy(data.email, template);
}

// Send job created notification
export async function sendJobCreatedNotification(data: JobCreatedEmailData) {
  const template = emailTemplates.jobCreated(data);
  return sendEmailLegacy(data.recipientEmail, template);
}

// Batch send job notifications with rate limiting
export async function sendBatchJobNotifications(notifications: JobCreatedEmailData[]) {
  const results = [];
  
  for (let i = 0; i < notifications.length; i++) {
    const notification = notifications[i];
    
    try {
      const result = await sendJobCreatedNotification(notification);
      results.push({ success: true, email: notification.recipientEmail, result });
    } catch (error) {
      console.error(`Failed to send notification to ${notification.recipientEmail}:`, error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      results.push({ success: false, email: notification.recipientEmail, error: errorMessage });
    }
    
    // Rate limiting: Wait 500ms between requests to stay under 2 req/sec limit
    // This gives us ~2 requests per second with some buffer
    if (i < notifications.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 500));
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

// Send bench invitation notification
export async function sendBenchInvitationEmail(data: BenchInvitationEmailData) {
  const template = emailTemplates.benchInvitation(data);
  return sendEmailLegacy(data.professionalEmail, template);
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
  const SURVEY_URL = process.env.AI_SURVEY_URL || 'https://www.taxproexchange.com/ai/survey';
  
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
    surveyUrl: SURVEY_URL,
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
    surveyUrl: SURVEY_URL,
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

// Send job poster notification
export async function sendJobPosterNotification(data: JobPosterNotificationEmailData) {
  const template = emailTemplates.jobPosterNotification(data);
  return sendEmail({
    to: data.email,
    subject: template.subject,
    html: template.html,
    text: template.text,
    from: 'TaxProExchange <support@taxproexchange.com>',
  });
}
