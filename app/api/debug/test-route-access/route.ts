import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const testJobId = 'edad1e0a-ad3f-4452-9c50-c18e407b85b7';
    const baseUrl = process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}` 
      : 'http://localhost:3000';
    
    // Test if the route is accessible at all
    const testUrls = [
      `${baseUrl}/api/jobs/${testJobId}/apply`,
      `${baseUrl}/api/jobs/${testJobId}/apply-test`,
      `${baseUrl}/api/debug/test-deployment`
    ];
    
    const results = [];
    
    for (const url of testUrls) {
      try {
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          }
        });
        
        results.push({
          url,
          status: response.status,
          statusText: response.statusText,
          accessible: response.status !== 404
        });
      } catch (error) {
        results.push({
          url,
          error: error instanceof Error ? error.message : 'Unknown error',
          accessible: false
        });
      }
    }

    return NextResponse.json({ 
      success: true,
      message: 'Route access test completed',
      baseUrl,
      testJobId,
      results,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    return NextResponse.json({ 
      error: 'Route test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
