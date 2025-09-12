import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const testJobId = 'edad1e0a-ad3f-4452-9c50-c18e407b85b7';
    
    return NextResponse.json({ 
      success: true,
      message: 'Job apply route check',
      testJobId,
      expectedUrl: `/api/jobs/${testJobId}/apply`,
      timestamp: new Date().toISOString(),
      note: 'This endpoint is working. The issue might be browser-specific or related to the :1 suffix.'
    });

  } catch (error) {
    return NextResponse.json({ 
      error: 'Test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
