import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const config = {
      hasStreamKey: !!process.env.STREAM_KEY,
      hasStreamSecret: !!process.env.STREAM_SECRET,
      hasStreamAppId: !!process.env.STREAM_APP_ID,
      hasNextPublicStreamKey: !!process.env.NEXT_PUBLIC_STREAM_KEY,
      streamKeyLength: process.env.STREAM_KEY?.length || 0,
      streamSecretLength: process.env.STREAM_SECRET?.length || 0,
      nextPublicStreamKeyLength: process.env.NEXT_PUBLIC_STREAM_KEY?.length || 0,
      environment: process.env.NODE_ENV,
      vercelEnv: process.env.VERCEL_ENV,
    };

    return NextResponse.json({ 
      success: true, 
      config,
      message: config.hasStreamKey && config.hasStreamSecret 
        ? 'Stream Chat environment variables are configured' 
        : 'Stream Chat environment variables are missing'
    });

  } catch (error) {
    return NextResponse.json({ 
      error: 'Failed to check configuration',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
