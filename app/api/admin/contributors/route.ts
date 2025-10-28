import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseService } from '@/lib/supabaseService';

export async function GET(request: Request) {
  try {
    // Admin-only endpoint
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin via Supabase (consistent with other admin routes)
    const supabase = supabaseService();
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('clerk_id', userId)
      .single();

    const isAdmin = profile?.is_admin || false;

    if (!isAdmin) {
      return NextResponse.json({ 
        error: 'Forbidden - Admin only'
      }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'all';

    let query = supabase
      .from('contributor_submissions')
      .select('*')
      .order('created_at', { ascending: false });

    if (status !== 'all') {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching submissions:', error);
      return NextResponse.json({ error: 'Failed to fetch submissions' }, { status: 500 });
    }

    return NextResponse.json({ submissions: data });

  } catch (error) {
    console.error('Error in admin contributors route:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

