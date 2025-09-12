import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

export async function GET() {
  console.log('🔍 Clerk auth test route called');
  try {
    const { userId } = await auth();
    console.log('🔍 Auth result:', { userId });
    
    return NextResponse.json({ 
      success: true,
      message: 'Clerk auth test endpoint working',
      userId,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('🔍 Clerk auth test error:', error);
    return NextResponse.json({ 
      error: 'Clerk auth test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
