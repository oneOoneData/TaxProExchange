import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseService } from '@/lib/supabaseService';

export const dynamic = 'force-dynamic';

// PATCH /api/jobs/[id]/applications/[applicationId] - Update application status
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; applicationId: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: jobId, applicationId } = await params;
    const body = await request.json();
    const { status, notes } = body;

    const supabase = supabaseService();

    // Verify the user owns this job
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .select('created_by, title')
      .eq('id', jobId)
      .single();

    if (jobError || !job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    if (job.created_by !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Validate status
    const validStatuses = ['applied', 'shortlisted', 'hired', 'withdrawn', 'rejected', 'completed'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    // Update application status
    const { data: application, error: updateError } = await supabase
      .from('job_applications')
      .update({ 
        status,
        notes: notes || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', applicationId)
      .eq('job_id', jobId)
      .select(`
        *,
        profiles!job_applications_applicant_profile_id_fkey(
          first_name,
          last_name,
          public_email
        )
      `)
      .single();

    if (updateError) {
      console.error('Application update error:', updateError);
      return NextResponse.json({ error: 'Failed to update application' }, { status: 500 });
    }

    // Send notification email to applicant about status change
    if (application?.profiles?.public_email) {
      try {
        await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/notify/application-status-changed`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Webhook-Secret': process.env.WEBHOOK_SECRET || '',
          },
          body: JSON.stringify({
            application_id: applicationId,
            job_title: job.title,
            new_status: status,
            applicant_email: application.profiles.public_email,
            applicant_name: `${application.profiles.first_name} ${application.profiles.last_name}`,
            notes: notes || null
          }),
        });
      } catch (emailError) {
        console.error('Failed to send status change notification:', emailError);
        // Don't fail the request if email fails
      }
    }

    return NextResponse.json({ 
      application,
      message: `Application status updated to ${status}` 
    });
  } catch (error) {
    console.error('Application status update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/jobs/[id]/applications/[applicationId] - Withdraw application (applicant only)
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; applicationId: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: jobId, applicationId } = await params;
    const supabase = supabaseService();

    // Verify the user owns this application
    const { data: application, error: appError } = await supabase
      .from('job_applications')
      .select('applicant_user_id, status')
      .eq('id', applicationId)
      .eq('job_id', jobId)
      .single();

    if (appError || !application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    if (application.applicant_user_id !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (application.status === 'hired' || application.status === 'completed') {
      return NextResponse.json({ error: 'Cannot withdraw completed applications' }, { status: 400 });
    }

    // Update status to withdrawn
    const { error: updateError } = await supabase
      .from('job_applications')
      .update({ 
        status: 'withdrawn',
        updated_at: new Date().toISOString()
      })
      .eq('id', applicationId);

    if (updateError) {
      console.error('Application withdrawal error:', updateError);
      return NextResponse.json({ error: 'Failed to withdraw application' }, { status: 500 });
    }

    return NextResponse.json({ 
      message: 'Application withdrawn successfully' 
    });
  } catch (error) {
    console.error('Application withdrawal error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
