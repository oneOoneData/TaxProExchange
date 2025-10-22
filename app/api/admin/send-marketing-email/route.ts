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
    .replace(/\{\{first_name\}\}/gi, userData.first_name || 'there')
    .replace(/\{\{last_name\}\}/gi, userData.last_name || '')
    .replace(/\{\{email\}\}/gi, userData.email || '')
    .replace(/\{\{FirstName\}\}/gi, userData.first_name || 'there')
    .replace(/\{\{LastName\}\}/gi, userData.last_name || '')
    .replace(/\{\{Email\}\}/gi, userData.email || '');
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
        public_email,
        first_name,
        last_name
      `)
      .or('email.not.is.null,public_email.not.is.null');

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
      const email = profile.email || profile.public_email;
      if (email) {
        userDataMap.set(email, {
          first_name: profile.first_name || '',
          last_name: profile.last_name || '',
          email: email
        });
      }
    });

    // Send personalized emails in batches to avoid timeouts
    const batchSize = 25; // Send 25 emails per batch
    const batches = chunk(recipients, batchSize);
    
    console.log(`📧 Starting batch email send: ${recipients.length} recipients in ${batches.length} batches of ${batchSize}`);
    
    for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
      const batch = batches[batchIndex];
      console.log(`📧 Processing batch ${batchIndex + 1}/${batches.length} (${batch.length} emails)`);
      
      for (const recipientEmail of batch) {
        const userData = userDataMap.get(recipientEmail) || { email: recipientEmail };
        const personalizedBody = personalizeEmail(body, userData);
        const personalizedSubject = personalizeEmail(subject, userData);
        
        try {
          await sendEmail({
            to: recipientEmail,
            subject: personalizedSubject,
            text: personalizedBody,
            from: from,
            replyTo: replyTo || process.env.EMAIL_REPLY_TO || 'support@taxproexchange.com',
          });
          
          emailsSent++;
          
          // Log progress every 5 emails
          if (emailsSent % 5 === 0) {
            console.log(`📧 Progress: ${emailsSent}/${recipients.length} emails sent`);
          }
          
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
                from: from,
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
      
      // Wait between batches to prevent overwhelming the system
      if (batchIndex < batches.length - 1) {
        console.log(`📧 Batch ${batchIndex + 1} complete. Waiting 2 seconds before next batch...`);
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    
    console.log(`📧 Batch email send complete: ${emailsSent} sent, ${emailsFailed} failed`);

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
