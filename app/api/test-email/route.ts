import { NextRequest, NextResponse } from 'next/server';
import { sendEmail } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const { to } = await request.json();

    if (!to) {
      return NextResponse.json({ error: 'Email address required' }, { status: 400 });
    }

    console.log('Testing email to:', to);
    console.log('RESEND_API_KEY exists:', !!process.env.RESEND_API_KEY);
    console.log('EMAIL_FROM:', process.env.EMAIL_FROM);
    console.log('EMAIL_REPLY_TO:', process.env.EMAIL_REPLY_TO);

    const emailResult = await sendEmail({
      to,
      subject: 'Test Email from TaxProExchange',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #1f2937; margin-bottom: 20px;">Test Email</h2>
          <p>This is a test email to verify email sending is working.</p>
          <p>If you receive this, the email system is working correctly!</p>
        </div>
      `,
      text: 'This is a test email to verify email sending is working. If you receive this, the email system is working correctly!'
    });

    console.log('Email result:', emailResult);

    return NextResponse.json({
      success: !emailResult.error,
      message: !emailResult.error ? 'Test email sent successfully' : 'Failed to send test email',
      details: emailResult
    });

  } catch (error) {
    console.error('Test email error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
