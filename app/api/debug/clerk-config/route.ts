import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const clerkSecretKey = process.env.CLERK_SECRET_KEY;
    const clerkPublishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
    
    // Test Clerk API connection
    let clerkTest = {
      connected: false,
      error: null as string | null,
      userCount: 0,
      environment: null as string | null
    };

    if (clerkSecretKey) {
      try {
        const response = await fetch('https://api.clerk.com/v1/users?limit=1', {
          headers: {
            'Authorization': `Bearer ${clerkSecretKey}`,
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const data = await response.json();
          clerkTest.connected = true;
          clerkTest.userCount = data.total_count || 0;
          clerkTest.environment = data.environment || 'unknown';
        } else {
          clerkTest.error = `HTTP ${response.status}: ${response.statusText}`;
        }
      } catch (error) {
        clerkTest.error = error instanceof Error ? error.message : 'Unknown error';
      }
    }

    return NextResponse.json({
      success: true,
      config: {
        hasSecretKey: !!clerkSecretKey,
        hasPublishableKey: !!clerkPublishableKey,
        secretKeyPrefix: clerkSecretKey ? clerkSecretKey.substring(0, 10) + '...' : 'NOT_SET',
        publishableKeyPrefix: clerkPublishableKey ? clerkPublishableKey.substring(0, 10) + '...' : 'NOT_SET',
      },
      clerkTest,
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        VERCEL_ENV: process.env.VERCEL_ENV,
        VERCEL_URL: process.env.VERCEL_URL,
      }
    });

  } catch (error) {
    console.error('Clerk config check error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
