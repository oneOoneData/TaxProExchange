import { NextResponse } from 'next/server';
import { supabaseService } from '@/lib/supabaseService';

export async function GET() {
  try {
    const supabase = supabaseService();
    
    // Check the structure of job_applications table
    const { data: applications, error } = await supabase
      .from('job_applications')
      .select('*')
      .limit(1);

    if (error) {
      return NextResponse.json({ 
        error: 'Database query failed',
        details: error.message 
      }, { status: 500 });
    }

    // Get column names from the first record
    const columnNames = applications && applications.length > 0 
      ? Object.keys(applications[0])
      : [];

    return NextResponse.json({ 
      success: true,
      message: 'Job applications table structure retrieved',
      columnNames,
      sampleRecord: applications?.[0] || null,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    return NextResponse.json({ 
      error: 'Check failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
