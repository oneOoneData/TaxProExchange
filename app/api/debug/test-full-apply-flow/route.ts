import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseService } from '@/lib/supabaseService';

export async function POST() {
  try {
    console.log('🔍 TEST Full apply flow started');
    
    const { userId } = await auth();
    console.log('🔍 TEST Auth result:', { userId });
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const testJobId = 'edad1e0a-ad3f-4452-9c50-c18e407b85b7';
    console.log('🔍 TEST Testing full apply flow for:', { testJobId, userId });

    const supabase = supabaseService();

    // Step 1: Get user's profile
    console.log('🔍 TEST Step 1: Getting user profile...');
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, visibility_state')
      .eq('clerk_id', userId)
      .single();

    if (profileError || !profile) {
      console.log('🔍 TEST Profile not found:', profileError);
      return NextResponse.json({ 
        error: 'Profile not found',
        details: profileError 
      }, { status: 404 });
    }

    console.log('🔍 TEST Profile found:', profile);

    // Step 2: Check job exists
    console.log('🔍 TEST Step 2: Checking job exists...');
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .select('id, status, created_by, title')
      .eq('id', testJobId)
      .single();

    if (jobError || !job) {
      console.log('🔍 TEST Job not found:', jobError);
      return NextResponse.json({ 
        error: 'Job not found',
        details: jobError 
      }, { status: 404 });
    }

    console.log('🔍 TEST Job found:', job);

    // Step 3: Check if already applied
    console.log('🔍 TEST Step 3: Checking if already applied...');
    const { data: existingApplication } = await supabase
      .from('job_applications')
      .select('id')
      .eq('job_id', testJobId)
      .eq('applicant_profile_id', profile.id)
      .single();

    if (existingApplication) {
      console.log('🔍 TEST Already applied:', existingApplication);
      return NextResponse.json({ 
        error: 'Already applied',
        existingApplication 
      }, { status: 400 });
    }

    console.log('🔍 TEST No existing application found');

    // Step 4: Try to create application (without actually creating it)
    console.log('🔍 TEST Step 4: Testing application creation...');
    const testApplicationData = {
      job_id: testJobId,
      applicant_profile_id: profile.id,
      applicant_user_id: userId,
      cover_note: 'TEST APPLICATION - Debug flow test',
      proposed_rate: 50,
      proposed_payout_type: 'hourly',
      proposed_timeline: 'ASAP',
      status: 'applied'
    };

    console.log('🔍 TEST Application data prepared:', testApplicationData);

    return NextResponse.json({ 
      success: true,
      message: 'Full apply flow test completed successfully',
      profile,
      job,
      existingApplication: null,
      testApplicationData,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('🔍 TEST Full apply flow error:', error);
    return NextResponse.json({ 
      error: 'Full apply flow test failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}
