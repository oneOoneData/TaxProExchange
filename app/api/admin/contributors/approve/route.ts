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
    const { submissionId, slug } = body;

    if (!submissionId || !slug) {
      return NextResponse.json(
        { error: 'Missing submissionId or slug' },
        { status: 400 }
      );
    }

    const supabase = supabaseService();

    // Get user profile ID for reviewed_by field
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('clerk_id', userId)
      .single();

    // Update submission status to approved
    const { error } = await supabase
      .from('contributor_submissions')
      .update({
        status: 'approved',
        article_slug: slug,
        reviewed_at: new Date().toISOString(),
        reviewed_by: profile?.id || null,
      })
      .eq('id', submissionId);

    if (error) {
      console.error('Error approving submission:', error);
      return NextResponse.json({ error: 'Failed to approve submission' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true,
      message: 'Submission approved successfully',
      slug
    });

  } catch (error) {
    console.error('Error in approve route:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

