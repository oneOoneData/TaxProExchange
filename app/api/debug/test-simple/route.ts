import { NextResponse } from 'next/server';

export async function POST() {
  console.log('🔍 Simple test route called');
  try {
    return NextResponse.json({ 
      success: true,
      message: 'Simple test POST endpoint working',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('🔍 Simple test error:', error);
    return NextResponse.json({ 
      error: 'Test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
