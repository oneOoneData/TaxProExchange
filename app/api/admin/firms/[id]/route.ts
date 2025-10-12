import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { auth } from '@clerk/nextjs/server';

// Check if user is admin
async function checkAdmin() {
  const { userId } = await auth();
  
  if (!userId) {
    return { isAdmin: false, userId: null };
  }

  const supabase = createServerClient();
  // Try both clerk_id and user_id for compatibility
  let { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('clerk_id', userId)
    .single();
  
  // Fallback to user_id if clerk_id didn't find anything
  if (!profile) {
    const result = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('user_id', userId)
      .single();
    profile = result.data;
  }

  const isAdmin = profile?.is_admin === true;
  
  return { isAdmin, userId };
}

// DELETE /api/admin/firms/[id] - Delete a firm
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { isAdmin } = await checkAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { id: firmId } = await params;

    if (!firmId) {
      return NextResponse.json({ error: 'Firm ID is required' }, { status: 400 });
    }

    const supabase = createServerClient();

    // Delete the firm (this will cascade to firm_members and firm_trusted_bench due to foreign key constraints)
    const { error } = await supabase
      .from('firms')
      .delete()
      .eq('id', firmId);

    if (error) {
      console.error('Database error deleting firm:', error);
      return NextResponse.json({ error: 'Failed to delete firm' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Firm deleted successfully' });
  } catch (error) {
    console.error('Error deleting firm:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

