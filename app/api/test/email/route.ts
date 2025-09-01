import { NextRequest, NextResponse } from 'next/server';
import { sendEmail } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const { to, subject = 'Test Email from TaxProExchange' } = await request.json();

    if (!to) {
      return NextResponse.json(
        { error: 'Email address required' },
        { status: 400 }
      );
    }

    const testHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Test Email</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 8px; margin-bottom: 30px;">
            <h1 style="color: white; margin: 0; font-size: 24px; text-align: center;">Test Email from TaxProExchange</h1>
          </div>
          
          <div style="background: #f8f9fa; padding: 25px; border-radius: 8px; margin-bottom: 25px;">
            <h2 style="color: #2d3748; margin-top: 0; font-size: 20px;">Email System Test</h2>
            
            <div style="margin: 20px 0;">
              <strong>Sent via:</strong> Resend (No Amazon SES)<br>
              <strong>From:</strong> support@taxproexchange.com<br>
              <strong>To:</strong> ${to}<br>
              <strong>Time:</strong> ${new Date().toISOString()}
            </div>
            
            <div style="background: #d1fae5; padding: 15px; border-radius: 6px; border-left: 4px solid #10b981;">
              <p style="margin: 0; color: #065f46;">
                <strong>✅ Success:</strong> This email was sent via Resend with proper SPF/DKIM/DMARC alignment.
              </p>
            </div>
          </div>
          
          <div style="border-top: 1px solid #e2e8f0; padding-top: 20px; margin-top: 30px; font-size: 14px; color: #718096;">
            <p>This is a test email to verify the email system is working correctly.</p>
            <p>TaxProExchange - Email System Test</p>
          </div>
        </body>
      </html>
    `;

    const testText = `Test Email from TaxProExchange\n\nEmail System Test\n\nSent via: Resend (No Amazon SES)\nFrom: support@taxproexchange.com\nTo: ${to}\nTime: ${new Date().toISOString()}\n\n✅ Success: This email was sent via Resend with proper SPF/DKIM/DMARC alignment.\n\nThis is a test email to verify the email system is working correctly.`;

    const result = await sendEmail({
      to,
      subject,
      html: testHtml,
      text: testText,
      replyTo: 'support@taxproexchange.com',
      listUnsubscribe: 'mailto:support@taxproexchange.com?subject=unsubscribe',
      headers: {
        'X-Test-Type': 'email-system-verification',
        'X-Provider': 'resend',
        'X-No-SES': 'true'
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Test email sent successfully via Resend',
      result,
      provider: 'resend',
      noSes: true,
      from: 'support@taxproexchange.com',
      headers: {
        'X-Test-Type': 'email-system-verification',
        'X-Provider': 'resend',
        'X-No-SES': 'true'
      }
    });

  } catch (error) {
    console.error('Test email error:', error);
    
    if (error instanceof Error && error.message.includes('RESEND_API_KEY')) {
      return NextResponse.json(
        { 
          error: 'Resend API key not configured',
          details: 'Please set RESEND_API_KEY in your environment variables',
          provider: 'resend',
          noSes: true
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { 
        error: 'Failed to send test email',
        details: error instanceof Error ? error.message : 'Unknown error',
        provider: 'resend',
        noSes: true
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Email test endpoint - use POST with { "to": "email@example.com" }',
    provider: 'resend',
    noSes: true,
    from: 'support@taxproexchange.com',
    features: [
      'Resend SDK integration',
      'No Amazon SES usage',
      'Proper SPF/DKIM/DMARC alignment',
      'List-Unsubscribe headers',
      'Custom email headers support'
    ]
  });
}
