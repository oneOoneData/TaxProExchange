import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ 
        error: 'Not authenticated',
        message: 'No user ID found - make sure you are signed in'
      }, { status: 401 });
    }

    // Test Clerk API call
    let clerkData = null;
    let clerkError = null;
    
    try {
      const response = await fetch(`https://api.clerk.com/v1/users/${userId}`, {
        headers: {
          'Authorization': `Bearer ${process.env.CLERK_SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        clerkData = await response.json();
      } else {
        clerkError = {
          status: response.status,
          statusText: response.statusText,
          text: await response.text()
        };
      }
    } catch (error) {
      clerkError = {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      };
    }

    return NextResponse.json({
      success: true,
      userId,
      clerkData: clerkData ? {
        id: clerkData.id,
        emailAddresses: clerkData.email_addresses?.map((e: any) => ({
          id: e.id,
          email: e.email_address,
          verified: e.verification?.status
        })) || [],
        primaryEmailId: clerkData.primary_email_address_id,
        firstName: clerkData.first_name,
        lastName: clerkData.last_name
      } : null,
      clerkError,
      environment: {
        hasClerkSecretKey: !!process.env.CLERK_SECRET_KEY,
        hasSupabaseUrl: !!process.env.SUPABASE_URL,
        hasSupabaseKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY
      }
    });

  } catch (error) {
    console.error('Debug endpoint error:', error);
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
