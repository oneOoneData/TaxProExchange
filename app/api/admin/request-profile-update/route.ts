import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendEmail, shouldSendEmail } from '@/lib/email';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.warn('Supabase environment variables not configured');
}

const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

export async function POST(request: NextRequest) {
  try {
    // Check if Supabase is configured
    if (!supabase) {
      console.log('❌ Supabase not configured');
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 503 }
      );
    }

    const { profileId, email, name } = await request.json();

    if (!profileId || !email || !name) {
      return NextResponse.json(
        { error: 'Missing required fields: profileId, email, name' },
        { status: 400 }
      );
    }

    console.log('📧 Sending profile update request:', { profileId, email, name });

    // Get profile details for the email
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('first_name, last_name, credential_type, firm_name, headline, email_preferences')
      .eq('id', profileId)
      .single();

    if (profileError || !profile) {
      console.error('❌ Profile not found:', profileError);
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      );
    }

    // Check if user has opted out of verification emails
    if (!shouldSendEmail(profile.email_preferences, 'verification_emails', true)) {
      console.log('📧 User has opted out of verification emails:', email);
      return NextResponse.json({
        success: false,
        message: 'User has opted out of verification emails'
      });
    }

    // Create email content
    const emailSubject = 'TaxProExchange - Profile Update Request';
    const emailBody = `
Dear ${profile.first_name} ${profile.last_name},

We hope this message finds you well. We're reaching out regarding your TaxProExchange profile to request some additional information that will help us better showcase your expertise to potential clients.

What we'd like you to update:

1. Professional Information: Please ensure your credentials, experience, and specializations are up to date
2. Business Details: Add or update your firm website, LinkedIn profile, or other professional presence
3. Service Areas: Verify your geographic service areas and multi-state capabilities
4. Specializations: Add any additional tax specialties or areas of expertise

How to update your profile:
- Visit: https://taxproexchange.com/profile/edit
- Log in with your existing credentials
- Review and update each section as needed

Why this matters:
Complete and up-to-date profiles receive more client inquiries and appear higher in search results. This helps you connect with more potential clients who need your expertise.

Your Current Profile:
- Name: ${profile.first_name} ${profile.last_name}
- Credential: ${profile.credential_type}
- Firm: ${profile.firm_name || 'Not specified'}
- Headline: ${profile.headline || 'Not specified'}

If you have any questions or need assistance updating your profile, please don't hesitate to reply to this email or contact us directly at koen@cardifftax.com.

Thank you for being part of the TaxProExchange community!

Best regards,
The TaxProExchange Team

---
TaxProExchange - Connecting Tax Professionals
https://taxproexchange.com

To manage your email preferences, visit: https://taxproexchange.com/settings
    `;

         // Send email using the local email service
     try {
       await sendEmail({
         to: email,
         subject: emailSubject,
         html: emailBody.replace(/\n/g, '<br>'),
         text: emailBody,
         replyTo: 'koen@cardifftax.com',
       });

      console.log('✅ Profile update request email sent successfully to:', email);

      return NextResponse.json({ 
        success: true, 
        message: 'Profile update request sent successfully' 
      });

    } catch (emailError) {
      console.error('❌ Email sending error:', emailError);
      return NextResponse.json(
        { error: 'Failed to send email' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('❌ Request profile update error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
