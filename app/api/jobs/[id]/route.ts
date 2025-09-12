import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseService } from '@/lib/supabaseService';

export const dynamic = 'force-dynamic';

// GET /api/jobs/[id] - Get job details
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const isAdminRequest = searchParams.get('admin') === 'true';
    
    const supabase = supabaseService();

    const { data: job, error } = await supabase
      .from('jobs')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    // Get firm information manually
    const { data: profile } = await supabase
      .from('profiles')
      .select('first_name, last_name, firm_name, visibility_state, slug')
      .eq('clerk_id', job.created_by)
      .single();

    // Check if the firm profile exists (unless admin request)
    if (!isAdminRequest && !profile) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    // For admin requests, include additional metadata
    const adminMetadata = isAdminRequest ? {
      admin_info: {
        can_edit: true,
        can_delete: true,
        created_by: job.created_by,
        original_status: job.status
      }
    } : {};

    return NextResponse.json({
      job: {
        ...job,
        firm: {
          name: profile?.firm_name || `${profile?.first_name} ${profile?.last_name}` || 'Unknown Firm',
          verified: profile?.visibility_state === 'verified',
          slug: profile?.slug
        },
        ...adminMetadata
      }
    });
  } catch (error) {
    console.error('Job fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH /api/jobs/[id] - Update job
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const supabase = supabaseService();

    // Check if user is admin
    const { data: userProfile, error: profileError } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('clerk_id', userId)
      .single();

    if (profileError || !userProfile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    const isAdmin = userProfile.is_admin;

    // Check if job exists
    const { data: existingJob, error: checkError } = await supabase
      .from('jobs')
      .select('created_by, status')
      .eq('id', id)
      .single();

    if (checkError || !existingJob) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    // Allow if user owns the job OR if user is admin
    if (!isAdmin && existingJob.created_by !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Admins can update any field, regular users have restrictions
    const updateData = isAdmin ? body : {
      ...body,
      // Regular users cannot change these fields
      created_by: undefined,
      status: undefined
    };

    // Update the job
    const { data: updatedJob, error: updateError } = await supabase
      .from('jobs')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Job update error:', updateError);
      return NextResponse.json({ error: 'Failed to update job' }, { status: 500 });
    }

    return NextResponse.json({ job: updatedJob });
  } catch (error) {
    console.error('Job update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/jobs/[id] - Soft delete job (set status to cancelled)
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const supabase = supabaseService();

    // Check if user is admin
    const { data: userProfile, error: profileError } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('clerk_id', userId)
      .single();

    if (profileError || !userProfile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    const isAdmin = userProfile.is_admin;

    // Check if job exists
    const { data: existingJob, error: checkError } = await supabase
      .from('jobs')
      .select('created_by, status')
      .eq('id', id)
      .single();

    if (checkError || !existingJob) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    // Allow if user owns the job OR if user is admin
    if (!isAdmin && existingJob.created_by !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Admins can hard delete or change status, regular users can only soft delete
    let updateData;
    if (isAdmin) {
      // Admin can choose to hard delete or change status
      const { forceDelete, newStatus } = await request.json().catch(() => ({}));
      
      if (forceDelete) {
        // Hard delete for admins
        const { error: deleteError } = await supabase
          .from('jobs')
          .delete()
          .eq('id', id);

        if (deleteError) {
          console.error('Job hard delete error:', deleteError);
          return NextResponse.json({ error: 'Failed to delete job' }, { status: 500 });
        }

        return NextResponse.json({ message: 'Job permanently deleted' });
      } else {
        // Change status (e.g., to 'cancelled', 'closed', 'archived')
        updateData = { status: newStatus || 'cancelled' };
      }
    } else {
      // Regular users can only soft delete
      updateData = { status: 'cancelled' };
    }

    // Update the job status
    const { data: updatedJob, error: updateError } = await supabase
      .from('jobs')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Job status update error:', updateError);
      return NextResponse.json({ error: 'Failed to update job status' }, { status: 500 });
    }

    return NextResponse.json({ job: updatedJob });
  } catch (error) {
    console.error('Job deletion error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
