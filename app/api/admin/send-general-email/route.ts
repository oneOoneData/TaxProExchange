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

    const { profileId, email, name, subject, message } = await request.json();

    if (!profileId || !email || !name || !subject || !message) {
      return NextResponse.json(
        { error: 'Missing required fields: profileId, email, name, subject, message' },
        { status: 400 }
      );
    }

    console.log('📧 Sending general email:', { profileId, email, name, subject });

    // Get profile details for the email
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('first_name, last_name, credential_type, firm_name')
      .eq('id', profileId)
      .single();

    if (profileError || !profile) {
      console.error('❌ Profile not found:', profileError);
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      );
    }

    // Create email content with proper formatting
    const emailBody = `
Dear ${profile.first_name} ${profile.last_name},

${message}

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
          subject: subject,
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

      console.log('✅ General email sent successfully to:', email);

      return NextResponse.json({ 
        success: true, 
        message: 'Email sent successfully' 
      });

    } catch (emailError) {
      console.error('❌ Email sending error:', emailError);
      return NextResponse.json(
        { error: 'Failed to send email' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('❌ Send general email error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
