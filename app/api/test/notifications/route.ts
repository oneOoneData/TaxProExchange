import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';
import { sendEmail } from '@/lib/email';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('first_name, last_name, public_email, email_preferences')
      .eq('clerk_id', userId)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // Test email sending
    const testEmail = profile.public_email || 'test@example.com';
    
    try {
      await sendEmail({
        to: testEmail,
        subject: 'TaxProExchange - Notification Test',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Notification Test</h2>
            <p>Hello ${profile.first_name},</p>
            <p>This is a test notification to verify that email notifications are working correctly.</p>
            <p>If you received this email, your notification system is functioning properly.</p>
            <p>Best regards,<br>The TaxProExchange Team</p>
          </div>
        `,
        text: `Notification Test\n\nHello ${profile.first_name},\n\nThis is a test notification to verify that email notifications are working correctly.\n\nIf you received this email, your notification system is functioning properly.\n\nBest regards,\nThe TaxProExchange Team`
      });

      return NextResponse.json({ 
        success: true, 
        message: 'Test notification sent successfully',
        email: testEmail,
        profile: {
          name: `${profile.first_name} ${profile.last_name}`,
          email: testEmail,
          emailPreferences: profile.email_preferences
        }
      });

    } catch (emailError) {
      console.error('Email sending error:', emailError);
      return NextResponse.json({ 
        error: 'Failed to send test email',
        details: emailError instanceof Error ? emailError.message : 'Unknown error',
        email: testEmail
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Notification test error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
