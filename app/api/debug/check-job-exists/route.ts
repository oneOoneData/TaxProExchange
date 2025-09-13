import { NextResponse } from 'next/server';
import { supabaseService } from '@/lib/supabaseService';

export async function GET() {
  try {
    const testJobId = 'edad1e0a-ad3f-4452-9c50-c18e407b85b7';
    const supabase = supabaseService();
    
    // Check if job exists
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .select('*')
      .eq('id', testJobId)
      .single();

    if (jobError) {
      return NextResponse.json({ 
        error: 'Job query failed',
        details: jobError.message,
        jobId: testJobId
      }, { status: 500 });
    }

    if (!job) {
      return NextResponse.json({ 
        error: 'Job not found',
        jobId: testJobId,
        message: 'No job found with this ID'
      }, { status: 404 });
    }

    return NextResponse.json({ 
      success: true,
      message: 'Job found',
      job: {
        id: job.id,
        title: job.title,
        status: job.status,
        created_by: job.created_by,
        created_at: job.created_at
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    return NextResponse.json({ 
      error: 'Check failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
