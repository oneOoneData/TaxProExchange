import { NextResponse } from 'next/server';
import { supabaseService } from '@/lib/supabaseService';
import { postJobToFacebook } from '@/lib/facebook';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  // Simple secret check so this isn't publicly callable
  const secret = request.headers.get('x-admin-secret');
  if (!secret || secret !== process.env.WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = supabaseService();

  const { data: job, error } = await supabase
    .from('jobs')
    .select('*')
    .eq('status', 'open')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error || !job) {
    return NextResponse.json({ error: 'No jobs found', detail: error?.message }, { status: 404 });
  }

  try {
    await postJobToFacebook(job);
    return NextResponse.json({ success: true, job_id: job.id, title: job.title });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
