import { NextResponse } from 'next/server';
import { supabaseService } from '@/lib/supabaseService';

export const dynamic = 'force-dynamic';

// GET /api/jobs/[id]/check-ownership - Check if a user owns a job by email
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: jobId } = await params;
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json({ error: 'Email parameter is required' }, { status: 400 });
    }

    const supabase = supabaseService();

    // Get the job to find the creator
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .select('created_by')
      .eq('id', jobId)
      .single();

    if (jobError || !job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    // Check if the email matches the job creator's profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('public_email')
      .eq('clerk_id', job.created_by)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ isOwner: false });
    }

    // Check if the email matches
    const isOwner = profile.public_email === email;

    return NextResponse.json({ isOwner });
  } catch (error) {
    console.error('Job ownership check error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
