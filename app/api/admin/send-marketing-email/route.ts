import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { sendEmail } from '@/lib/email';

// Helper function to chunk array into smaller batches
function chunk<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

// Helper function to personalize email content
function personalizeEmail(content: string, userData: { first_name?: string; last_name?: string; email?: string }): string {
  return content
    .replace(/\{\{first_name\}\}/g, userData.first_name || 'there')
    .replace(/\{\{last_name\}\}/g, userData.last_name || '')
    .replace(/\{\{email\}\}/g, userData.email || '');
}

export async function POST(req: NextRequest) {
  try {
    const { from, replyTo, subject, body, recipients } = await req.json();

    // Validate required fields
    if (!from || !subject || !body || !recipients || !Array.isArray(recipients)) {
      return NextResponse.json(
        { error: 'Missing required fields: from, subject, body, recipients' },
        { status: 400 }
      );
    }

    if (recipients.length === 0) {
      return NextResponse.json(
        { error: 'No recipients specified' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const invalidEmails = recipients.filter(email => !emailRegex.test(email));
    if (invalidEmails.length > 0) {
      return NextResponse.json(
        { error: `Invalid email addresses: ${invalidEmails.join(', ')}` },
        { status: 400 }
      );
    }

    let emailsSent = 0;
    let emailsFailed = 0;
    const failedEmails: string[] = [];

    // Get user data for personalization
    const supabase = createServerClient();
    const { data: profilesData, error: profilesError } = await supabase
      .from('profiles')
      .select(`
        id,
        email,
        first_name,
        last_name
      `)
      .in('email', recipients);

    if (profilesError) {
      console.error('Error fetching profile data:', profilesError);
      return NextResponse.json(
        { error: 'Failed to fetch profile data for personalization' },
        { status: 500 }
      );
    }

    // Create a map of email to profile data for quick lookup
    const userDataMap = new Map();
    profilesData?.forEach(profile => {
      userDataMap.set(profile.email, {
        first_name: profile.first_name || '',
        last_name: profile.last_name || '',
        email: profile.email
      });
    });

    // Send personalized emails individually
    for (const recipientEmail of recipients) {
      try {
        const userData = userDataMap.get(recipientEmail) || { email: recipientEmail };
        const personalizedBody = personalizeEmail(body, userData);
        const personalizedSubject = personalizeEmail(subject, userData);

        await sendEmail({
          to: recipientEmail,
          subject: personalizedSubject,
          text: personalizedBody,
          replyTo: replyTo || process.env.EMAIL_REPLY_TO || 'support@taxproexchange.com',
        });
        
        emailsSent++;
        
        // Small delay between emails to respect rate limits
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        console.error(`Failed to send email to ${recipientEmail}:`, error);
        
        // Check if it's a rate limit error
        if (error && typeof error === 'object' && 'statusCode' in error && error.statusCode === 429) {
          console.log(`Rate limit hit, waiting 1 second before retry for ${recipientEmail}`);
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Retry once after waiting
          try {
            await sendEmail({
              to: recipientEmail,
              subject: personalizedSubject,
              text: personalizedBody,
              replyTo: replyTo || process.env.EMAIL_REPLY_TO || 'support@taxproexchange.com',
            });
            emailsSent++;
            console.log(`Retry successful for ${recipientEmail}`);
          } catch (retryError) {
            console.error(`Retry failed for ${recipientEmail}:`, retryError);
            emailsFailed++;
            failedEmails.push(recipientEmail);
          }
        } else {
          emailsFailed++;
          failedEmails.push(recipientEmail);
        }
      }
    }

    // Log the email send to database
    try {
      const { error: logError } = await supabase
        .from('email_log')
        .insert({
          from_email: from,
          subject,
          recipients,
          emails_sent: emailsSent,
          emails_failed: emailsFailed,
          sent_at: new Date().toISOString(),
        });

      if (logError) {
        console.error('Failed to log email send:', logError);
      }
    } catch (logError) {
      console.error('Failed to log email send:', logError);
    }

    return NextResponse.json({
      success: true,
      emailsSent,
      emailsFailed,
      totalRecipients: recipients.length,
      failedEmails: failedEmails.length > 0 ? failedEmails : undefined,
    });

  } catch (error) {
    console.error('Marketing email API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
