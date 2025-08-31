import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { auth } from '@clerk/nextjs/server';

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: 'Database configuration error' }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Test basic connection
    const { data: testData, error: testError } = await supabase
      .from('profiles')
      .select('count')
      .limit(1);

    if (testError) {
      return NextResponse.json({ 
        error: 'Database connection failed', 
        details: testError 
      }, { status: 500 });
    }

    // Test profile lookup
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, clerk_user_id')
      .eq('clerk_user_id', userId)
      .single();

    if (profileError) {
      return NextResponse.json({ 
        error: 'Profile lookup failed', 
        details: profileError,
        userId,
        testData
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      profile,
      testData,
      message: 'Database connection and profile lookup successful'
    });

  } catch (error) {
    console.error('Debug connection test error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
