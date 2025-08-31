import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (!supabase) {
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 503 }
      );
    }

    // Get full profile data (check both main clerk_id and additional_clerk_ids)
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .or(`clerk_id.eq.${userId},additional_clerk_ids.cs.{${userId}}`)
      .single();

    if (error) {
      return NextResponse.json({ 
        error: 'Profile not found',
        clerkId: userId,
        supabaseError: error
      });
    }

    return NextResponse.json({ 
      profile,
      clerkId: userId,
      isAdmin: profile.is_admin || false
    });

  } catch (error) {
    console.error('Debug profile error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
