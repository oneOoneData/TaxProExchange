import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { auth } from '@clerk/nextjs/server';

// Check if user is admin
async function checkAdmin() {
  const { userId } = await auth();
  
  if (!userId) {
    return { isAdmin: false, userId: null };
  }

  const supabase = createServerClient();
  // Try both clerk_id and user_id for compatibility
  let { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('clerk_id', userId)
    .single();
  
  // Fallback to user_id if clerk_id didn't find anything
  if (!profile) {
    const result = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('user_id', userId)
      .single();
    profile = result.data;
  }

  const isAdmin = profile?.is_admin === true;
  
  return { isAdmin, userId };
}

// POST /api/notify-job-posters/manual-log - Manually log emails to prevent duplicates
export async function POST(request: NextRequest) {
  try {
    const { isAdmin, userId } = await checkAdmin();
    
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 403 }
      );
    }

    const { emails } = await request.json();
    
    if (!emails || !Array.isArray(emails) || emails.length === 0) {
      return NextResponse.json(
        { error: 'Please provide an array of email addresses' },
        { status: 400 }
      );
    }

    const supabase = createServerClient();

    // Insert manual log entries for each email
    const logEntries = emails.map(email => ({
      from_email: 'TaxProExchange <support@taxproexchange.com>',
      subject: 'You have new applicants waiting on TaxProExchange',
      recipients: [email],
      emails_sent: 1,
      emails_failed: 0,
      sent_at: new Date().toISOString()
    }));

    const { data, error } = await supabase
      .from('email_log')
      .insert(logEntries)
      .select();

    if (error) {
      console.error('Error inserting manual log entries:', error);
      return NextResponse.json(
        { error: 'Failed to insert log entries' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: `Successfully logged ${emails.length} emails to prevent duplicates`,
      loggedEmails: emails,
      logEntries: data
    });

  } catch (error) {
    console.error('Manual log error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
