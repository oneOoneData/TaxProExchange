import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { sendEmail } from '@/lib/email';
import { performSpamCheck, createSpamResponse } from '@/lib/antispam';
import { NextRequest } from 'next/server';

export async function POST(request: Request) {
  try {
    // Check authentication
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { feedbackType, message } = body;

    // Perform spam checks (even for authenticated users)
    const spamCheck = await performSpamCheck(request as unknown as NextRequest, body);
    if (spamCheck.isSpam) {
      console.log(`Spam detected on feedback submission: ${spamCheck.reason}`);
      return createSpamResponse(spamCheck.reason || 'Unknown spam reason');
    }

    if (!feedbackType || !message?.trim()) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get user info from Clerk
    const { clerkClient } = await import('@clerk/nextjs/server');
    const client = await clerkClient();
    const user = await client.users.getUser(userId);

    const userName = user.fullName || user.firstName || 'Unknown User';
    const userEmail = user.primaryEmailAddress?.emailAddress || 'No email';

    // Create email content
    const feedbackTypeLabels: Record<string, string> = {
      improvement: '💡 Improvement',
      idea: '🚀 New Idea',
      bug: '🐛 Bug Report',
      other: '📝 Other',
    };

    const typeLabel = feedbackTypeLabels[feedbackType] || feedbackType;

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>New Feedback Submission</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 8px; margin-bottom: 30px;">
            <h1 style="color: white; margin: 0; font-size: 24px; text-align: center;">New Feedback Submission</h1>
          </div>
          
          <div style="background: #f8f9fa; padding: 25px; border-radius: 8px; margin-bottom: 25px;">
            <h2 style="color: #2d3748; margin-top: 0; font-size: 20px;">${typeLabel}</h2>
            
            <div style="margin: 20px 0;">
              <strong>From:</strong> ${userName}<br>
              <strong>Email:</strong> ${userEmail}<br>
              <strong>User ID:</strong> ${userId}<br>
              <strong>Type:</strong> ${typeLabel}
            </div>
            
            <div style="background: white; padding: 20px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #667eea;">
              <h3 style="margin-top: 0; color: #2d3748; font-size: 16px;">Feedback:</h3>
              <p style="margin: 0; color: #4a5568; white-space: pre-wrap;">${message}</p>
            </div>
          </div>
          
          <div style="border-top: 1px solid #e2e8f0; padding-top: 20px; margin-top: 30px; font-size: 14px; color: #718096;">
            <p>This feedback was submitted via the TaxProExchange feedback form.</p>
            <p>Timestamp: ${new Date().toISOString()}</p>
          </div>
        </body>
      </html>
    `;

    const text = `
New Feedback Submission - ${typeLabel}

From: ${userName}
Email: ${userEmail}
User ID: ${userId}
Type: ${typeLabel}

Feedback:
${message}

---
This feedback was submitted via the TaxProExchange feedback form.
Timestamp: ${new Date().toISOString()}
    `;

    // Send email to admin
    await sendEmail({
      to: 'koen@cardifftax.com',
      subject: `[TaxProExchange Feedback] ${typeLabel} from ${userName}`,
      html,
      text,
      replyTo: userEmail,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error submitting feedback:', error);
    return NextResponse.json(
      { error: 'Failed to submit feedback' },
      { status: 500 }
    );
  }
}

