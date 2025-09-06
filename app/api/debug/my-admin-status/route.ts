import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function supabaseService() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = supabaseService();
    
    // Get your profile details
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('id, clerk_id, first_name, last_name, is_admin, email, public_email, created_at')
      .eq('clerk_id', userId)
      .single();

    if (error) {
      return NextResponse.json({ 
        error: 'Profile not found', 
        details: error.message,
        userId 
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      userId,
      profile: {
        id: profile.id,
        clerk_id: profile.clerk_id,
        name: `${profile.first_name} ${profile.last_name}`,
        email: profile.email,
        public_email: profile.public_email,
        is_admin: profile.is_admin,
        created_at: profile.created_at
      },
      isAdmin: profile.is_admin || false
    });

  } catch (error) {
    console.error('Debug endpoint error:', error);
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
