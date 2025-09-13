import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseService } from '@/lib/supabaseService';

export async function POST() {
  try {
    console.log('🔍 TEST Direct original apply route called');
    
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
      .select('id')
      .eq('job_id', testJobId)
      .eq('applicant_user_id', userId)
      .single();

    if (existingApplication) {
      console.log('🔍 TEST User already applied');
      return NextResponse.json({ error: 'You have already applied to this job' }, { status: 400 });
    }

    console.log('🔍 TEST No existing application, creating new one...');

    // Create application
    const { data: application, error: applicationError } = await supabase
      .from('job_applications')
      .insert({
        job_id: testJobId,
        applicant_user_id: userId,
        cover_note: 'TEST APPLICATION - Direct route test',
        proposed_rate: 50,
        proposed_payout_type: 'hourly',
        proposed_timeline: 'ASAP',
        status: 'applied'
      })
      .select()
      .single();

    if (applicationError) {
      console.log('🔍 TEST Application creation failed:', applicationError);
      return NextResponse.json({ error: 'Failed to create application' }, { status: 500 });
    }

    console.log('🔍 TEST Application created successfully:', application);

    return NextResponse.json({ 
      success: true,
      message: 'Direct test application created successfully',
      application,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('🔍 TEST Direct apply error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
