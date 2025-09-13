import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseService } from '@/lib/supabaseService';

export const dynamic = 'force-dynamic';

// POST /api/jobs/[id]/apply-test - Test job application
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  console.log('🔍 TEST Job application route called');
  try {
    const { userId } = await auth();
    console.log('🔍 TEST Auth result:', { userId });
    
    if (!userId) {
      console.log('🔍 TEST No userId, returning 401');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: jobId } = await params;
    console.log('🔍 TEST Job application request received:', { jobId, userId });
    
    return NextResponse.json({ 
      success: true,
      message: 'TEST Job application route working',
      jobId,
      userId,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('🔍 TEST Job application error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
