import { NextResponse } from 'next/server';
import { supabaseService } from '@/lib/supabaseService';

export async function GET() {
  console.log('🔍 Supabase service test route called');
  try {
    const supabase = supabaseService();
    console.log('🔍 Supabase service created successfully');
    
    return NextResponse.json({ 
      success: true,
      message: 'Supabase service test endpoint working',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('🔍 Supabase service test error:', error);
    return NextResponse.json({ 
      error: 'Supabase service test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
