import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';

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

    // Delete all user-owned data before removing the profile
    const { data: ownedJobs, error: ownedJobsError } = await supabase
      .from('jobs')
      .select('id')
      .eq('created_by', userId);

    if (ownedJobsError) {
      console.error('Error fetching owned jobs:', ownedJobsError);
      return NextResponse.json(
        { error: 'Failed to delete profile' },
        { status: 500 }
      );
    }

    const ownedJobIds = (ownedJobs || []).map((job) => job.id);

    if (ownedJobIds.length > 0) {
      const { error: ownedJobAppsError } = await supabase
        .from('job_applications')
        .delete()
        .in('job_id', ownedJobIds);

      if (ownedJobAppsError) {
        console.error('Error deleting applications for owned jobs:', ownedJobAppsError);
        return NextResponse.json(
          { error: 'Failed to delete profile' },
          { status: 500 }
        );
      }
    }

    const deletionSteps = [
      supabase.from('connections').delete().or(`requester_profile_id.eq.${profile.id},recipient_profile_id.eq.${profile.id}`),
      supabase.from('job_applications').delete().or(`applicant_profile_id.eq.${profile.id},applicant_user_id.eq.${userId}`),
      supabase.from('reviews_preparer_by_firm').delete().or(`reviewee_profile_id.eq.${profile.id},reviewer_user_id.eq.${userId}`),
      supabase.from('mentorship_preferences').delete().eq('profile_id', profile.id),
      supabase.from('profile_specializations').delete().eq('profile_id', profile.id),
      supabase.from('profile_locations').delete().eq('profile_id', profile.id),
      supabase.from('profile_software').delete().eq('profile_id', profile.id),
      supabase.from('licenses').delete().eq('profile_id', profile.id),
      supabase.from('slack_join_attempts').delete().eq('profile_id', profile.id),
      supabase.from('slack_members').delete().eq('profile_id', profile.id),
      supabase.from('jobs').update({ assigned_profile_id: null }).eq('assigned_profile_id', profile.id),
      supabase.from('profiles').update({ referrer_profile_id: null }).eq('referrer_profile_id', profile.id),
      supabase.from('jobs').delete().eq('created_by', userId)
    ];

    const deletionResults = await Promise.all(deletionSteps);
    const deletionError = deletionResults.find((result) => result.error)?.error;

    if (deletionError) {
      console.error('Error deleting profile data:', deletionError);
      return NextResponse.json(
        { error: 'Failed to delete profile' },
        { status: 500 }
      );
    }

    const { error: deleteProfileError } = await supabase
      .from('profiles')
      .delete()
      .eq('id', profile.id);

    if (deleteProfileError) {
      console.error('Error deleting profile:', deleteProfileError);
      return NextResponse.json(
        { error: 'Failed to delete profile' },
        { status: 500 }
      );
    }

    // Delete the user from Clerk as well
    try {
      console.log('Attempting to delete user from Clerk:', userId);
      
      const response = await fetch(`https://api.clerk.com/v1/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${process.env.CLERK_SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Clerk API error: ${response.status} - ${JSON.stringify(errorData)}`);
      }

      console.log('User deleted from Clerk successfully');
    } catch (clerkError) {
      console.error('Error deleting user from Clerk:', clerkError);
      console.error('Clerk error details:', JSON.stringify(clerkError, null, 2));
      // Don't fail the entire operation if Clerk deletion fails
      // The profile data is already removed from the database
    }

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
