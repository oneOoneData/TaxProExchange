import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

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

    // Update profile to verified status
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        visibility_state: 'verified',
        is_listed: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', profileId);

    if (profileError) {
      console.error('Error updating profile:', profileError);
      return NextResponse.json(
        { error: 'Failed to update profile' },
        { status: 500 }
      );
    }

    // Update all licenses to verified status
    const { error: licenseError } = await supabase
      .from('licenses')
      .update({
        status: 'verified',
        updated_at: new Date().toISOString()
      })
      .eq('profile_id', profileId);

    if (licenseError) {
      console.error('Error updating licenses:', licenseError);
      // Don't fail the whole operation if license update fails
    }

    // TODO: Send email notification to user about approval
    // TODO: Log admin action in audit_logs table

    return NextResponse.json({
      success: true,
      message: 'Profile approved successfully'
    });

  } catch (error) {
    console.error('Profile approval error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
