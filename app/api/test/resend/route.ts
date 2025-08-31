import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { sendEmail } from '@/lib/email';
import { supabaseService } from '@/lib/supabaseService';

export const dynamic = 'force-dynamic';

// POST /api/test/resend - Send a test email to verify Resend is working
export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = supabaseService();
    
    // Get the current user's profile to find their email
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('first_name, last_name, public_email')
      .eq('clerk_id', userId)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ 
        error: 'Profile not found. Please complete onboarding first.' 
      }, { status: 404 });
    }

    if (!profile.public_email) {
      return NextResponse.json({ 
        error: 'No email found in profile. Please update your profile with an email address.' 
      }, { status: 400 });
    }

    // Create a test email template
    const testEmailTemplate = {
      subject: '🧪 Resend Test Email - TaxProExchange',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #1f2937;">✅ Resend Email Test Successful!</h2>
          
          <p>Hello <strong>${profile.first_name} ${profile.last_name}</strong>,</p>
          
          <p>This is a test email to verify that Resend is working correctly in your TaxProExchange application.</p>
          
          <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #374151;">Test Details:</h3>
            <ul style="margin: 10px 0; padding-left: 20px;">
              <li><strong>Recipient:</strong> ${profile.public_email}</li>
              <li><strong>Sent at:</strong> ${new Date().toLocaleString()}</li>
              <li><strong>Environment:</strong> ${process.env.NODE_ENV || 'development'}</li>
            </ul>
          </div>
          
          <p>If you received this email, congratulations! 🎉 Your Resend integration is working properly.</p>
          
          <p>You can now use this email service for:</p>
          <ul style="margin: 10px 0; padding-left: 20px;">
            <li>Job application notifications</li>
            <li>Application status updates</li>
            <li>Job creation notifications</li>
            <li>Verification emails</li>
          </ul>
          
          <p>Best regards,<br>The TaxProExchange Team</p>
          
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
          <p style="font-size: 12px; color: #6b7280;">
            This is a test email from TaxProExchange. 
            Please do not reply to this email.
          </p>
        </div>
      `,
      text: `
Resend Email Test Successful!

Hello ${profile.first_name} ${profile.last_name},

This is a test email to verify that Resend is working correctly in your TaxProExchange application.

Test Details:
- Recipient: ${profile.public_email}
- Sent at: ${new Date().toLocaleString()}
- Environment: ${process.env.NODE_ENV || 'development'}

If you received this email, congratulations! Your Resend integration is working properly.

You can now use this email service for:
- Job application notifications
- Application status updates
- Job creation notifications
- Verification emails

Best regards,
The TaxProExchange Team

---
This is a test email from TaxProExchange. Please do not reply to this email.
      `
    };

    // Send the test email
    const result = await sendEmail(profile.public_email, testEmailTemplate);
    
    console.log('Test email sent successfully:', result);

    return NextResponse.json({
      success: true,
      message: 'Test email sent successfully',
      recipient: profile.public_email,
      recipientName: `${profile.first_name} ${profile.last_name}`,
      result
    });

  } catch (error) {
    console.error('Resend test error:', error);
    
    // Check if it's a Resend configuration error
    if (error instanceof Error && error.message.includes('RESEND_API_KEY')) {
      return NextResponse.json({
        error: 'Resend API key not configured',
        details: 'Please set RESEND_API_KEY in your environment variables'
      }, { status: 500 });
    }
    
    return NextResponse.json({
      error: 'Failed to send test email',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// GET /api/test/resend - Get current user's email info for testing
export async function GET(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = supabaseService();
    
    // Get the current user's profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('first_name, last_name, public_email, clerk_id')
      .eq('clerk_id', userId)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ 
        error: 'Profile not found. Please complete onboarding first.' 
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      profile: {
        firstName: profile.first_name,
        lastName: profile.last_name,
        email: profile.public_email,
        clerkId: profile.clerk_id
      },
      hasEmail: !!profile.public_email,
      canTest: !!profile.public_email
    });

  } catch (error) {
    console.error('Profile fetch error:', error);
    return NextResponse.json({
      error: 'Failed to fetch profile',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
