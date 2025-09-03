import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.warn('Supabase environment variables not configured');
}

const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check if Supabase is configured
    if (!supabase) {
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 503 }
      );
    }

    const { id: profileId } = await params;

    // TODO: Add admin role check here
    // For now, allow access to anyone (we'll secure this later)

    // Soft delete the profile
    const { error } = await supabase
      .from('profiles')
      .update({
        is_deleted: true,
        deleted_at: new Date().toISOString(),
        visibility_state: 'hidden',
        is_listed: false
      })
      .eq('id', profileId);

    if (error) {
      console.error('Error soft deleting profile:', error);
      return NextResponse.json(
        { error: 'Failed to soft delete profile' },
        { status: 500 }
      );
    }

    // TODO: Log admin action in audit_logs table

    return NextResponse.json({
      success: true,
      message: 'Profile soft deleted successfully'
    });

  } catch (error) {
    console.error('Profile soft delete error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
