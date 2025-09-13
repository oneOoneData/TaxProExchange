import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Test if we can access the original job apply route
    const testJobId = 'edad1e0a-ad3f-4452-9c50-c18e407b85b7';
    const testUrl = `/api/jobs/${testJobId}/apply`;
    
    return NextResponse.json({ 
      success: true,
      message: 'Original job apply route test endpoint working',
      testJobId,
      testUrl,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    return NextResponse.json({ 
      error: 'Test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
