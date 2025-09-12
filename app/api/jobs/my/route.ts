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
      .select('*')
      .eq('created_by', userId)
      .order('created_at', { ascending: false });

    if (jobsError) {
      console.error('My jobs fetch error:', jobsError);
      return NextResponse.json({ error: 'Failed to fetch jobs' }, { status: 500 });
    }

    // Get firm information for each job manually
    const jobsWithFirms = await Promise.all(
      jobs?.map(async (job) => {
        const { data: profile } = await supabase
          .from('profiles')
          .select('first_name, last_name, firm_name, visibility_state, slug')
          .eq('clerk_id', job.created_by)
          .single();

        return {
          ...job,
          firm: {
            name: profile?.firm_name || `${profile?.first_name} ${profile?.last_name}` || 'Unknown Firm',
            verified: profile?.visibility_state === 'verified',
            slug: profile?.slug
          }
        };
      }) || []
    );

    return NextResponse.json({
      success: true,
      jobs: jobsWithFirms || []
    });

  } catch (error) {
    console.error('My jobs fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
