import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseService } from '@/lib/supabaseService';

export async function POST(request: Request) {
  try {
    // Admin-only endpoint
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const { clerkClient } = await import('@clerk/nextjs/server');
    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    const isAdmin = user.publicMetadata?.role === 'admin';

    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden - Admin only' }, { status: 403 });
    }

    const body = await request.json();
    const { submissionId } = body;

    if (!submissionId) {
      return NextResponse.json(
        { error: 'Missing submissionId' },
        { status: 400 }
      );
    }

    const supabase = supabaseService();

    // Update submission status to published
    const { error } = await supabase
      .from('contributor_submissions')
      .update({
        status: 'published',
      })
      .eq('id', submissionId);

    if (error) {
      console.error('Error marking submission as published:', error);
      return NextResponse.json({ error: 'Failed to update submission' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true,
      message: 'Submission marked as published'
    });

  } catch (error) {
    console.error('Error in mark-published route:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

