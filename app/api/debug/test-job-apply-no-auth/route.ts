import { NextResponse } from 'next/server';

export async function POST() {
  console.log('🔍 No-auth job apply test route called');
  try {
    return NextResponse.json({ 
      success: true,
      message: 'No-auth job apply test POST endpoint working',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('🔍 No-auth job apply test error:', error);
    return NextResponse.json({ 
      error: 'Test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
