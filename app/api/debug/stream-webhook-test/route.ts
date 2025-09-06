import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    console.log('🧪 Stream webhook test called');
    console.log('🧪 Request body:', JSON.stringify(body, null, 2));
    console.log('🧪 Request headers:', Object.fromEntries(req.headers.entries()));
    
    return NextResponse.json({ 
      success: true, 
      message: 'Test webhook received',
      receivedAt: new Date().toISOString(),
      bodyType: typeof body,
      bodyKeys: Object.keys(body || {}),
      hasMessage: !!body.message,
      hasChannel: !!body.channel,
      messageType: body.type
    });
    
  } catch (error) {
    console.error('🧪 Stream webhook test error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error',
      receivedAt: new Date().toISOString()
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ 
    message: 'Stream webhook test endpoint - use POST to test',
    webhookUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'https://taxproexchange.com'}/api/webhooks/stream-message`,
    testUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'https://taxproexchange.com'}/api/debug/stream-webhook-test`
  });
}
