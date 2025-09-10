import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { status, notes } = await request.json();
    const applicationId = params.id;

    if (!status || !['applied', 'shortlisted', 'hired', 'rejected', 'withdrawn'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get current user's profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('clerk_id', userId)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // Verify the user owns the job that this application is for
    const { data: application, error: applicationError } = await supabase
      .from('job_applications')
      .select(`
        id,
        job:jobs(
          id,
          created_by
        )
      `)
      .eq('id', applicationId)
      .single();

    if (applicationError || !application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    if (application.job.created_by !== profile.id) {
      return NextResponse.json({ error: 'Unauthorized to update this application' }, { status: 403 });
    }

    // Update the application status
    const { data: updatedApplication, error: updateError } = await supabase
      .from('job_applications')
      .update({
        status,
        notes: notes || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', applicationId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating application status:', updateError);
      return NextResponse.json({ error: 'Failed to update application' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      application: updatedApplication 
    });

  } catch (error) {
    console.error('Error in /api/profile/applications/[id]/update-status:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
