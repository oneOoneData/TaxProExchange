import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const testJobId = 'edad1e0a-ad3f-4452-9c50-c18e407b85b7';
    
    // Test if the original route exists by making a request to it
    const baseUrl = process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}` 
      : 'http://localhost:3000';
    
    const testUrl = `${baseUrl}/api/jobs/${testJobId}/apply`;
    
    return NextResponse.json({ 
      success: true,
      message: 'Apply route test endpoint working',
      testJobId,
      testUrl,
      baseUrl,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    return NextResponse.json({ 
      error: 'Test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}