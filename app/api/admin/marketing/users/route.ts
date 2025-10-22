import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    // Get all users with their email and name information
    const supabase = createServerClient();
    const { data: users, error } = await supabase
      .from('users')
      .select(`
        id,
        email,
        profiles(
          first_name,
          last_name
        )
      `)
      .not('email', 'is', null)
      .order('email');

    if (error) {
      console.error('Error fetching users:', error);
      return NextResponse.json(
        { error: 'Failed to fetch users' },
        { status: 500 }
      );
    }

    console.log('🔍 Users API: Raw data from Supabase:', { users, count: users?.length });

    // Transform the data to flatten the profile information
    const transformedUsers = users?.map(user => ({
      id: user.id,
      email: user.email,
      first_name: user.profiles?.[0]?.first_name || '',
      last_name: user.profiles?.[0]?.last_name || '',
    })) || [];

    console.log('🔍 Users API: Transformed users:', { transformedUsers, count: transformedUsers.length });

    return NextResponse.json({
      users: transformedUsers,
      count: transformedUsers.length,
    });

  } catch (error) {
    console.error('Users API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
