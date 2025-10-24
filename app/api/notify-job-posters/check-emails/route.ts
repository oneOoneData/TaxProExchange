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

// GET /api/notify-job-posters/check-emails - Check if users have emails stored elsewhere
export async function GET(request: NextRequest) {
  try {
    const { isAdmin, userId } = await checkAdmin();
    
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 403 }
      );
    }

    const supabase = createServerClient();

    // Get the specific user IDs that are missing emails
    const missingEmailUserIds = [
      'user_341DbTFGy3Ob24wci9Ir726LXsv', // Kellan Johnson
      'user_32QXxERs6nslZ1p80CWYx7TRDzE', // Nick Morrison
      'user_32woNFasOea3Q4PGzlAXizem0L0', // Alona Larina
      'user_33NxmzSGztxRek81cTU6hG7U95B', // Garrett Dearden
      'user_32uwQqvBp0AIhwqbZlOKFAdZnBc'  // Caroline Gunning
    ];

    // Check profiles table for these users
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('clerk_id, user_id, first_name, last_name, public_email')
      .in('clerk_id', missingEmailUserIds);

    // Also check if they exist in the users table (if it exists)
    // Note: This might not exist in your schema, but let's try
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, email')
      .in('id', missingEmailUserIds);

    return NextResponse.json({
      message: 'Email check for missing job posters',
      missingEmailUserIds,
      profilesFound: profiles || [],
      usersFound: users || [],
      errors: {
        profilesError: profilesError?.message,
        usersError: usersError?.message
      },
      analysis: {
        profilesWithEmail: profiles?.filter(p => p.public_email).length || 0,
        profilesWithoutEmail: profiles?.filter(p => !p.public_email).length || 0
      }
    });

  } catch (error) {
    console.error('Check emails error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
