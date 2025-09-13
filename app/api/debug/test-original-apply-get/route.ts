import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseService } from '@/lib/supabaseService';

export async function GET() {
  try {
    console.log('🔍 TEST GET original apply route called');
    
    const { userId } = await auth();
    console.log('🔍 TEST Auth result:', { userId });
    
    if (!userId) {
      console.log('🔍 TEST No userId, returning 401');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const testJobId = 'edad1e0a-ad3f-4452-9c50-c18e407b85b7';
    console.log('🔍 TEST Testing job application for:', { testJobId, userId });

    const supabase = supabaseService();
    
    // Check if job exists
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .select('id, status, created_by, title, firm_name')
      .eq('id', testJobId)
      .single();

    if (jobError || !job) {
      console.log('🔍 TEST Job not found:', jobError);
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    console.log('🔍 TEST Job found:', job);

    // Check if user already applied
    const { data: existingApplication } = await supabase
      .from('job_applications')
      .select('id, status')
      .eq('job_id', testJobId)
      .eq('applicant_user_id', userId)
      .single();

    if (existingApplication) {
      console.log('🔍 TEST User already applied:', existingApplication);
      return NextResponse.json({ 
        error: 'You have already applied to this job',
        existingApplication 
      }, { status: 400 });
    }

    console.log('🔍 TEST No existing application found');

    return NextResponse.json({ 
      success: true,
      message: 'GET test completed - ready to apply',
      job,
      existingApplication: null,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('🔍 TEST GET apply error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
