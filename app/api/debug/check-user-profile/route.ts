import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseService } from '@/lib/supabaseService';

export async function GET() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = supabaseService();

    // Get user's profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, visibility_state, clerk_id')
      .eq('clerk_id', userId)
      .single();

    if (profileError) {
      return NextResponse.json({ 
        error: 'Profile query failed',
        details: profileError.message 
      }, { status: 500 });
    }

    if (!profile) {
      return NextResponse.json({ 
        error: 'Profile not found',
        userId 
      }, { status: 404 });
    }

    return NextResponse.json({ 
      success: true,
      message: 'User profile retrieved',
      profile,
      canApply: profile.visibility_state === 'verified',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    return NextResponse.json({ 
      error: 'Check failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
