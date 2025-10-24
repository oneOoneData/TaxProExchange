import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { auth } from '@clerk/nextjs/server';
import { sendJobPosterNotification } from '@/lib/email';

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

// POST /api/notify-job-posters/test - Send test notification to admin email
export async function POST(request: NextRequest) {
  try {
    const { isAdmin, userId } = await checkAdmin();
    
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 403 }
      );
    }

    const supabase = createServerClient();

    // Get admin email from environment variables
    const adminEmail = process.env.ADMIN_EMAIL || 'koen@cardifftax.com';
    
    // Get a sample job poster name for the test email
    // We'll use a realistic name for testing purposes
    const testFirstName = 'John';

    try {
      await sendJobPosterNotification({
        firstName: testFirstName,
        email: adminEmail,
        applicationsLink: 'https://www.taxproexchange.com/profile/applications'
      });
      
      return NextResponse.json({
        message: 'Test email sent successfully',
        recipient: adminEmail,
        testData: {
          firstName: testFirstName,
          applicationsLink: 'https://www.taxproexchange.com/profile/applications'
        }
      });
      
    } catch (error) {
      console.error(`Failed to send test email to ${adminEmail}:`, error);
      return NextResponse.json(
        { 
          error: 'Failed to send test email',
          details: error instanceof Error ? error.message : 'Unknown error'
        },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Test email error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
