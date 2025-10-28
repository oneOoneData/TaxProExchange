import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseService } from '@/lib/supabaseService';
import { sendEmail } from '@/lib/email';

export async function POST(request: Request) {
  try {
    // Admin-only endpoint
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const { clerkClient } = await import('@clerk/nextjs/server');
    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    const isAdmin = user.publicMetadata?.role === 'admin';

    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden - Admin only' }, { status: 403 });
    }

    const body = await request.json();
    const { submissionId, reason } = body;

    if (!submissionId || !reason) {
      return NextResponse.json(
        { error: 'Missing submissionId or reason' },
        { status: 400 }
      );
    }

    const supabase = supabaseService();

    // Get submission details
    const { data: submission } = await supabase
      .from('contributor_submissions')
      .select('*')
      .eq('id', submissionId)
      .single();

    if (!submission) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
    }

    // Get user profile ID for reviewed_by field
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('clerk_id', userId)
      .single();

    // Update submission status to rejected
    const { error } = await supabase
      .from('contributor_submissions')
      .update({
        status: 'rejected',
        reviewed_at: new Date().toISOString(),
        reviewed_by: profile?.id || null,
      })
      .eq('id', submissionId);

    if (error) {
      console.error('Error rejecting submission:', error);
      return NextResponse.json({ error: 'Failed to reject submission' }, { status: 500 });
    }

    // Send rejection email
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Contribution Update</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 8px; margin-bottom: 30px;">
            <h1 style="color: white; margin: 0; font-size: 24px; text-align: center;">Contribution Update</h1>
          </div>
          
          <div style="background: #f8f9fa; padding: 25px; border-radius: 8px; margin-bottom: 25px;">
            <p style="color: #2d3748; font-size: 16px; margin: 0 0 20px 0;">
              Hi <strong>${submission.name}</strong>,
            </p>
            
            <p style="color: #4a5568; font-size: 16px; margin: 20px 0;">
              Thank you for submitting your article "<strong>${submission.title}</strong>" to the TaxProExchange AI Hub.
            </p>
            
            <p style="color: #4a5568; font-size: 16px; margin: 20px 0;">
              After review, we've decided not to move forward with this submission at this time. Here's the feedback from our team:
            </p>
            
            <div style="background: white; padding: 20px; border-radius: 6px; border-left: 4px solid #667eea; margin: 20px 0;">
              <p style="margin: 0; color: #4a5568; white-space: pre-wrap;">${reason}</p>
            </div>

            <p style="color: #4a5568; font-size: 16px; margin: 20px 0;">
              We appreciate your interest in contributing and encourage you to submit again in the future if you have content that aligns with our guidelines.
            </p>

            <p style="color: #4a5568; font-size: 16px; margin: 20px 0;">
              If you have any questions, feel free to reply to this email.
            </p>
          </div>
          
          <div style="border-top: 1px solid #e2e8f0; padding-top: 20px; margin-top: 30px; font-size: 14px; color: #718096; text-align: center;">
            <p style="margin: 10px 0;">
              – The TaxProExchange Team
            </p>
          </div>
        </body>
      </html>
    `;

    const text = `
Contribution Update

Hi ${submission.name},

Thank you for submitting your article "${submission.title}" to the TaxProExchange AI Hub.

After review, we've decided not to move forward with this submission at this time. Here's the feedback from our team:

${reason}

We appreciate your interest in contributing and encourage you to submit again in the future if you have content that aligns with our guidelines.

If you have any questions, feel free to reply to this email.

– The TaxProExchange Team
    `;

    await sendEmail({
      to: submission.email,
      subject: 'Update on Your TaxProExchange Contribution',
      html,
      text,
      replyTo: 'koen@cardifftax.com',
      from: 'TaxProExchange <support@taxproexchange.com>',
    });

    return NextResponse.json({ 
      success: true,
      message: 'Submission rejected and email sent'
    });

  } catch (error) {
    console.error('Error in reject route:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

