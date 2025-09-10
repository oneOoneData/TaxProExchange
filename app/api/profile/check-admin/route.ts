import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.warn('Supabase environment variables not configured');
}

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

    // Check if Supabase is configured
    if (!supabase) {
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 503 }
      );
    }

    // Check if user has admin role
    console.log('🔍 Checking admin status for userId:', userId);
    
    // Check for user with matching Clerk ID and get their admin status
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('is_admin, clerk_id, first_name, last_name')
      .eq('clerk_id', userId)
      .single();

    console.log('🔍 Profile query result:', { profile, error });

    if (error || !profile) {
      // If profile not found, user is not admin
      console.log('🔍 Profile not found or error:', error);
      return NextResponse.json({ isAdmin: false });
    }

    console.log('🔍 Admin status:', profile.is_admin);
    return NextResponse.json({ 
      isAdmin: profile.is_admin || false 
    });

  } catch (error) {
    console.error('Admin check error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
