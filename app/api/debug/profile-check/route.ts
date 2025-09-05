import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseService } from '@/lib/supabaseService';

export async function GET() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const supabase = supabaseService();
    
    // Get all profiles to see what's in the database
    const { data: allProfiles, error: allError } = await supabase
      .from('profiles')
      .select('id, clerk_id, first_name, last_name, visibility_state, firm_name')
      .limit(10);
    
    // Try to find the specific user's profile
    const { data: userProfile, error: userError } = await supabase
      .from('profiles')
      .select('id, clerk_id, first_name, last_name, visibility_state, firm_name')
      .eq('clerk_id', userId)
      .single();
    
    return NextResponse.json({
      userId,
      allProfiles: allProfiles || [],
      allError: allError?.message || null,
      userProfile: userProfile || null,
      userError: userError?.message || null,
      totalProfiles: allProfiles?.length || 0
    });
    
  } catch (error) {
    return NextResponse.json({ 
      error: 'Debug failed', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}
