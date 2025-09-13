import { NextResponse } from 'next/server';
import { supabaseService } from '@/lib/supabaseService';

export async function GET() {
  try {
    const supabase = supabaseService();
    
    // Check recent job applications
    const { data: applications, error } = await supabase
      .from('job_applications')
      .select(`
        id,
        job_id,
        applicant_id,
        status,
        created_at,
        cover_note,
        proposed_rate,
        proposed_payout_type,
        proposed_timeline
      `)
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      return NextResponse.json({ 
        error: 'Database query failed',
        details: error.message 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true,
      message: 'Recent job applications retrieved',
      applications: applications || [],
      count: applications?.length || 0,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    return NextResponse.json({ 
      error: 'Check failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
