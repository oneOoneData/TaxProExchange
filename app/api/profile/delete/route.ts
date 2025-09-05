import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';
import { clerkClient } from '@clerk/nextjs/server';

export const dynamic = 'force-dynamic';

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.warn('Supabase environment variables not configured');
}

const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

export async function DELETE(request: NextRequest) {
  try {
    // Check if Supabase is configured
    if (!supabase) {
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 503 }
      );
    }

    // Get the authenticated user from Clerk
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized - please sign in' },
        { status: 401 }
      );
    }

    // Find the user's profile by clerk_id
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, clerk_id')
      .eq('clerk_id', userId)
      .eq('is_deleted', false)
      .single();

    if (profileError || !profile) {
      console.error('Error finding profile:', profileError);
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      );
    }

    // Verify the profile belongs to the authenticated user
    if (profile.clerk_id !== userId) {
      return NextResponse.json(
        { error: 'Unauthorized - profile does not belong to user' },
        { status: 403 }
      );
    }

    // Soft delete the profile (safer than hard delete)
    const { error: deleteError } = await supabase
      .from('profiles')
      .update({
        is_deleted: true,
        deleted_at: new Date().toISOString(),
        visibility_state: 'hidden',
        is_listed: false
      })
      .eq('id', profile.id);

    if (deleteError) {
      console.error('Error soft deleting profile:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete profile' },
        { status: 500 }
      );
    }

    // Delete the user from Clerk as well
    try {
      await clerkClient().users.deleteUser(userId);
      console.log('User deleted from Clerk successfully');
    } catch (clerkError) {
      console.error('Error deleting user from Clerk:', clerkError);
      // Don't fail the entire operation if Clerk deletion fails
      // The profile is already soft deleted, which is the most important part
    }

    // TODO: Consider also deleting related data like:
    // - Profile specializations
    // - Connections
    // - Applications
    // - Any other user-specific data

    return NextResponse.json({
      success: true,
      message: 'Profile and account deleted successfully'
    });

  } catch (error) {
    console.error('Profile deletion error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
