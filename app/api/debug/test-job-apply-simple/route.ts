import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

export async function POST() {
  console.log('🔍 Simple job apply test route called');
  try {
    const { userId } = await auth();
    console.log('🔍 Auth result:', { userId });
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json({ 
      success: true,
      message: 'Simple job apply test POST endpoint working',
      userId,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('🔍 Simple job apply test error:', error);
    return NextResponse.json({ 
      error: 'Test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
