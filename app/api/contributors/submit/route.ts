import { NextResponse } from 'next/server';
import { supabaseService } from '@/lib/supabaseService';
import { sendEmail } from '@/lib/email';
import { headers } from 'next/headers';

interface SubmissionData {
  name: string;
  email: string;
  firm?: string;
  title: string;
  topic: string;
  draft_url?: string;
  message?: string;
}

export async function POST(request: Request) {
  try {
    // Parse request body
    const body = await request.json() as SubmissionData;
    const { name, email, firm, title, topic, draft_url, message } = body;

    // Validate required fields
    if (!name?.trim() || !email?.trim() || !title?.trim() || !topic?.trim()) {
      return NextResponse.json(
        { error: 'Missing required fields: name, email, title, and topic are required' },
        { status: 400 }
      );
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      );
    }

    // Get IP address for rate limiting
    const headersList = await headers();
    const ip_address = headersList.get('x-forwarded-for')?.split(',')[0] || 
                       headersList.get('x-real-ip') || 
                       'unknown';

    const supabase = supabaseService();

    // Check for duplicate submission from same email within 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { data: recentSubmission } = await supabase
      .from('contributor_submissions')
      .select('id, created_at')
      .eq('email', email.toLowerCase().trim())
      .gte('created_at', sevenDaysAgo.toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (recentSubmission) {
      return NextResponse.json(
        { error: 'You have already submitted a contribution recently. Please wait before submitting again.' },
        { status: 429 }
      );
    }

    // Check for IP-based rate limiting (max 3 submissions per IP per day)
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);

    const { data: ipSubmissions } = await supabase
      .from('contributor_submissions')
      .select('id')
      .eq('ip_address', ip_address)
      .gte('created_at', oneDayAgo.toISOString());

    if (ipSubmissions && ipSubmissions.length >= 3) {
      return NextResponse.json(
        { error: 'Too many submissions from this location. Please try again later.' },
        { status: 429 }
      );
    }

    // Insert submission
    const { data, error } = await supabase
      .from('contributor_submissions')
      .insert({
        name: name.trim(),
        email: email.toLowerCase().trim(),
        firm: firm?.trim() || null,
        title: title.trim(),
        topic: topic.trim(),
        draft_url: draft_url?.trim() || null,
        message: message?.trim() || null,
        status: 'pending',
        ip_address,
      })
      .select()
      .single();

    if (error) {
      console.error('Error inserting submission:', error);
      return NextResponse.json(
        { error: 'Failed to submit contribution' },
        { status: 500 }
      );
    }

    // Send admin notification email (non-blocking)
    const adminEmail = process.env.ADMIN_EMAIL || 'koen@cardifftax.com';
    const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.taxproexchange.com';
    
    try {
      const html = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>New AI Hub Contribution</title>
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #0EA5E9 0%, #6366F1 100%); padding: 30px; border-radius: 8px; margin-bottom: 30px;">
              <h1 style="color: white; margin: 0; font-size: 24px; text-align: center;">📝 New AI Hub Contribution</h1>
            </div>
            
            <div style="background: #f8f9fa; padding: 25px; border-radius: 8px; margin-bottom: 25px;">
              <h2 style="color: #2d3748; margin-top: 0; font-size: 20px;">${title}</h2>
              
              <div style="margin: 20px 0; padding: 15px; background: white; border-radius: 6px;">
                <p style="margin: 5px 0;"><strong>Author:</strong> ${name}</p>
                <p style="margin: 5px 0;"><strong>Email:</strong> <a href="mailto:${email}" style="color: #0EA5E9;">${email}</a></p>
                ${firm ? `<p style="margin: 5px 0;"><strong>Firm:</strong> ${firm}</p>` : ''}
                <p style="margin: 5px 0;"><strong>Topic:</strong> ${topic}</p>
                <p style="margin: 5px 0;"><strong>Submitted:</strong> ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
              </div>

              ${draft_url ? `
                <div style="margin: 20px 0; padding: 15px; background: #e0f2fe; border-left: 4px solid #0EA5E9; border-radius: 6px;">
                  <p style="margin: 0 0 8px 0; font-weight: 600; color: #0c4a6e;">Draft URL:</p>
                  <a href="${draft_url}" target="_blank" style="color: #0EA5E9; word-break: break-all;">${draft_url}</a>
                </div>
              ` : ''}

              ${message ? `
                <div style="margin: 20px 0; padding: 15px; background: white; border-radius: 6px; border-left: 4px solid #6366F1;">
                  <p style="margin: 0 0 8px 0; font-weight: 600; color: #4338ca;">Additional Details:</p>
                  <p style="margin: 0; color: #4a5568; white-space: pre-wrap;">${message}</p>
                </div>
              ` : ''}
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${siteUrl}/admin/contributors" style="display: inline-block; background: linear-gradient(135deg, #0EA5E9 0%, #6366F1 100%); color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
                Review in Admin Dashboard
              </a>
            </div>

            <div style="background: #fef3c7; padding: 15px; border-radius: 6px; border-left: 4px solid #f59e0b; margin: 20px 0;">
              <p style="margin: 0; color: #92400e; font-size: 14px;">
                <strong>Action Required:</strong> Review this submission and approve or reject it from the admin dashboard.
              </p>
            </div>
            
            <div style="border-top: 1px solid #e2e8f0; padding-top: 20px; margin-top: 30px; font-size: 14px; color: #718096; text-align: center;">
              <p>This notification was sent automatically when a new AI Hub contribution was submitted.</p>
            </div>
          </body>
        </html>
      `;

      const text = `
New AI Hub Contribution Submitted

Title: ${title}
Author: ${name}
Email: ${email}
${firm ? `Firm: ${firm}` : ''}
Topic: ${topic}
Submitted: ${new Date().toISOString()}

${draft_url ? `Draft URL: ${draft_url}\n` : ''}
${message ? `Additional Details:\n${message}\n` : ''}

Review in admin dashboard: ${siteUrl}/admin/contributors

Action Required: Review this submission and approve or reject it from the admin dashboard.
      `;

      await sendEmail({
        to: adminEmail,
        subject: `New AI Hub Contribution: "${title}" from ${name}`,
        html,
        text,
        replyTo: email,
        from: 'TaxProExchange <support@taxproexchange.com>',
      });
    } catch (emailError) {
      // Log but don't fail the submission if email fails
      console.error('Failed to send admin notification email:', emailError);
    }

    return NextResponse.json({ 
      success: true,
      message: 'Thank you for your submission! We\'ll review it and get back to you soon.',
      submission_id: data.id
    });

  } catch (error) {
    console.error('Error processing contributor submission:', error);
    return NextResponse.json(
      { error: 'Failed to process submission' },
      { status: 500 }
    );
  }
}

