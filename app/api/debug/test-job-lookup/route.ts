import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseService } from '@/lib/supabaseService';

export async function GET() {
  try {
    const { userId } = await auth();
    const testJobId = 'edad1e0a-ad3f-4452-9c50-c18e407b85b7';
    
    if (!userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const supabase = supabaseService();

    // Test the exact same query as in the apply route
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .select('id, status, created_by, title, firm_name')
      .eq('id', testJobId)
      .single();

    // Also test a broader query
    const { data: allJobs, error: allJobsError } = await supabase
      .from('jobs')
      .select('id, status, created_by, title')
      .limit(5);

    return NextResponse.json({ 
      success: true,
      message: 'Job lookup test completed',
      userId,
      testJobId,
      jobQuery: {
        job,
        jobError: jobError ? {
          message: jobError.message,
          code: jobError.code,
          details: jobError.details,
          hint: jobError.hint
        } : null
      },
      allJobsQuery: {
        jobs: allJobs,
        error: allJobsError ? {
          message: allJobsError.message,
          code: allJobsError.code
        } : null
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    return NextResponse.json({ 
      error: 'Job lookup test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
