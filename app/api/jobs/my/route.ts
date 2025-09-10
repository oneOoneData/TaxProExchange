import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get jobs created by the current user
    const { data: jobs, error: jobsError } = await supabase
      .from('jobs')
      .select(`
        *,
        firm:profiles!jobs_created_by_fkey(
          name,
          verified,
          slug
        )
      `)
      .eq('created_by', userId)
      .order('created_at', { ascending: false });

    if (jobsError) {
      console.error('My jobs fetch error:', jobsError);
      return NextResponse.json({ error: 'Failed to fetch jobs' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      jobs: jobs || []
    });

  } catch (error) {
    console.error('My jobs fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
