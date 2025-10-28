import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseService } from '@/lib/supabaseService';

export async function GET() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ 
        error: 'Not logged in',
        userId: null,
        isAdmin: false
      });
    }

    // Check admin status
    const { clerkClient } = await import('@clerk/nextjs/server');
    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    const isAdmin = user.publicMetadata?.role === 'admin';

    // Get submissions from Supabase
    const supabase = supabaseService();
    const { data: submissions, error } = await supabase
      .from('contributor_submissions')
      .select('*')
      .order('created_at', { ascending: false });

    return NextResponse.json({
      userId,
      userEmail: user.emailAddresses[0]?.emailAddress,
      isAdmin,
      publicMetadata: user.publicMetadata,
      submissionsCount: submissions?.length || 0,
      submissions: submissions || [],
      error: error?.message || null,
      tableExists: !error || error.code !== '42P01', // 42P01 = table doesn't exist
    });

  } catch (error: any) {
    console.error('Debug error:', error);
    return NextResponse.json({ 
      error: error.message,
      stack: error.stack 
    }, { status: 500 });
  }
}

