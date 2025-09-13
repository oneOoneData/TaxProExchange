import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const testJobId = 'edad1e0a-ad3f-4452-9c50-c18e407b85b7';
    const baseUrl = process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}` 
      : 'http://localhost:3000';
    
    const originalRouteUrl = `${baseUrl}/api/jobs/${testJobId}/apply`;
    
    // Test if the original route is accessible
    const response = await fetch(originalRouteUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        cover_note: 'Test application from debug endpoint',
        proposed_rate: 50,
        proposed_payout_type: 'hourly',
        proposed_timeline: 'ASAP'
      })
    });

    const responseText = await response.text();
    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch {
      responseData = responseText;
    }

    return NextResponse.json({ 
      success: true,
      message: 'Original route test completed',
      originalRouteUrl,
      responseStatus: response.status,
      responseData,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    return NextResponse.json({ 
      error: 'Route test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
