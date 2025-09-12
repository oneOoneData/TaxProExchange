import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Test if we can access the job apply route
    const testJobId = 'test-job-id';
    const testUrl = `/api/jobs/${testJobId}/apply`;
    
    return NextResponse.json({ 
      success: true,
      message: 'Job apply route test endpoint working',
      testUrl,
      userId
    });

  } catch (error) {
    return NextResponse.json({ 
      error: 'Test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
