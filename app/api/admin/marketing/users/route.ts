import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    // Get all profiles with their email and name information
    const supabase = createServerClient();
    
    // Query profiles directly since users table is empty
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select(`
        id,
        email,
        first_name,
        last_name
      `)
      .not('email', 'is', null)
      .order('email')
      .limit(1000); // Explicitly set high limit
    
    // Also get total count for debugging
    const { count: totalProfiles } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });
    
    const { count: profilesWithEmails } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .not('email', 'is', null);
    
    console.log('🔍 Users API: Profile counts:', { 
      totalProfiles, 
      profilesWithEmails, 
      returnedProfiles: profiles?.length 
    });
    
    if (error) {
      console.error('Error fetching profiles:', error);
      return NextResponse.json(
        { error: 'Failed to fetch profiles' },
        { status: 500 }
      );
    }

    // Transform the data to match expected format
    const transformedUsers = profiles?.map(profile => ({
      id: profile.id,
      email: profile.email,
      first_name: profile.first_name || '',
      last_name: profile.last_name || '',
    })) || [];

    console.log('🔍 Users API: Transformed users:', { transformedUsers, count: transformedUsers.length });

    return NextResponse.json({
      users: transformedUsers,
      count: transformedUsers.length,
    });

  } catch (error) {
    console.error('Profiles API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
