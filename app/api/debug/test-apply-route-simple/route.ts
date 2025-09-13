import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const testJobId = 'edad1e0a-ad3f-4452-9c50-c18e407b85b7';
    const baseUrl = process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}` 
      : 'http://localhost:3000';
    
    // Test if we can access the route at all
    const testUrl = `${baseUrl}/api/jobs/${testJobId}/apply`;
    
    // Try a simple GET request first
    const getResponse = await fetch(testUrl, { method: 'GET' });
    
    // Try a POST request
    const postResponse = await fetch(testUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ test: 'data' })
    });

    return NextResponse.json({ 
      success: true,
      message: 'Route accessibility test completed',
      testUrl,
      getStatus: getResponse.status,
      getStatusText: getResponse.statusText,
      postStatus: postResponse.status,
      postStatusText: postResponse.statusText,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    return NextResponse.json({ 
      error: 'Route test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
