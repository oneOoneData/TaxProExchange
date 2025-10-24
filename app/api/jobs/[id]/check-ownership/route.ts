import { NextResponse } from 'next/server';
import { supabaseService } from '@/lib/supabaseService';
import { auth } from '@clerk/nextjs/server';

export const dynamic = 'force-dynamic';

// GET /api/jobs/[id]/check-ownership - Check if a user owns a job by clerk_id
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: jobId } = await params;
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

    // Check if the current user's clerk_id matches the job creator's clerk_id
    const isOwner = job.created_by === userId;

    return NextResponse.json({ isOwner });
  } catch (error) {
    console.error('Job ownership check error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
