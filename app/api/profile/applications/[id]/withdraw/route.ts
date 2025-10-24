import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseService } from '@/lib/supabaseService';

export const dynamic = 'force-dynamic';

// DELETE /api/profile/applications/[id]/withdraw - Withdraw application (applicant only)
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: applicationId } = await params;
    const supabase = supabaseService();

    // Get the application to find the job ID and verify ownership
    const { data: application, error: appError } = await supabase
      .from('job_applications')
      .select('applicant_user_id, job_id, status')
      .eq('id', applicationId)
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
