import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

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

    console.log('📧 Sending verification request email:', { profileId, email, name });

    // Get profile details for the email
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('first_name, last_name, credential_type, firm_name, headline')
      .eq('id', profileId)
      .single();

    if (profileError || !profile) {
      console.error('❌ Profile not found:', profileError);
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      );
    }

    // Create email content
    const emailSubject = 'TaxProExchange - Profile Verification Request';
    const emailBody = `
Dear ${profile.first_name} ${profile.last_name},

Thank you for joining TaxProExchange! We're reviewing your profile and need some additional information to complete your verification.

**What we need from you:**

1. **Professional Credentials**: Please provide documentation of your ${profile.credential_type} credentials
2. **Business Information**: If you have a firm website, LinkedIn profile, or other professional presence, please share those links
3. **Experience Details**: Any additional information about your tax preparation experience and specializations

**How to provide this information:**
- Reply to this email with the requested information
- Or update your profile at: https://taxproexchange.com/profile/edit

**Your Current Profile:**
- Name: ${profile.first_name} ${profile.last_name}
- Credential: ${profile.credential_type}
- Firm: ${profile.firm_name || 'Not specified'}
- Headline: ${profile.headline || 'Not specified'}

Once we receive this information, we'll review it and verify your profile within 24-48 hours.

If you have any questions, please don't hesitate to reply to this email.

Best regards,
The TaxProExchange Team

---
TaxProExchange - Connecting Tax Professionals
https://taxproexchange.com
    `;

    // Send email using the existing email service
    try {
      const emailResponse = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/send-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        },
        body: JSON.stringify({
          to: email,
          subject: emailSubject,
          html: emailBody.replace(/\n/g, '<br>'),
          text: emailBody,
        }),
      });

      if (!emailResponse.ok) {
        console.error('❌ Email service error:', emailResponse.status, emailResponse.statusText);
        return NextResponse.json(
          { error: 'Failed to send email' },
          { status: 500 }
        );
      }

      console.log('✅ Verification request email sent successfully to:', email);

      // Update profile to mark that verification was requested
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ 
          visibility_state: 'pending_verification',
          updated_at: new Date().toISOString()
        })
        .eq('id', profileId);

      if (updateError) {
        console.error('❌ Error updating profile status:', updateError);
        // Don't fail the request if profile update fails, email was still sent
      }

      return NextResponse.json({ 
        success: true, 
        message: 'Verification request email sent successfully' 
      });

    } catch (emailError) {
      console.error('❌ Email sending error:', emailError);
      return NextResponse.json(
        { error: 'Failed to send email' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('❌ Request verification info error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
