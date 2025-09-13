import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const testJobId = 'edad1e0a-ad3f-4452-9c50-c18e407b85b7';
    const baseUrl = process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}` 
      : 'http://localhost:3000';
    
    // Test POST request to the apply route
    const applyUrl = `${baseUrl}/api/jobs/${testJobId}/apply`;
    
    const response = await fetch(applyUrl, {
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
      message: 'POST test completed',
      applyUrl,
      responseStatus: response.status,
      responseStatusText: response.statusText,
      responseData,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    return NextResponse.json({ 
      error: 'POST test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
