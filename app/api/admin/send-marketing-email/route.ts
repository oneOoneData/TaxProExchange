import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { sendEmail } from '@/lib/email';

// Helper function to chunk array into smaller batches
function chunk<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

export async function POST(req: NextRequest) {
  try {
    const { from, subject, body, recipients } = await req.json();

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

    // Send emails in batches of 50 to respect Resend rate limits
    const batches = chunk(recipients, 50);
    
    for (const batch of batches) {
      try {
        await sendEmail({
          to: batch,
          subject,
          text: body,
          replyTo: process.env.EMAIL_REPLY_TO || 'support@taxproexchange.com',
        });
        
        emailsSent += batch.length;
        
        // Small delay between batches to respect rate limits
        if (batches.indexOf(batch) < batches.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      } catch (error) {
        console.error('Failed to send batch:', error);
        emailsFailed += batch.length;
        failedEmails.push(...batch);
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
