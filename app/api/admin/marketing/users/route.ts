import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    // Get all profiles with their email and name information
    const supabase = createServerClient();
    
    // Query profiles with public_email (the email field doesn't exist in profiles table)
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select(`
        id,
        clerk_id,
        public_email,
        first_name,
        last_name
      `)
      .not('public_email', 'is', null) // Only get profiles with public_email
      .not('clerk_id', 'is', null) // Only get profiles with Clerk IDs
      .limit(1000);
    
    // Also get total count for debugging
    const { count: totalProfiles } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });
    
    const { count: profilesWithEmails } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .not('public_email', 'is', null);
    
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
    // Note: We only query profiles with public_email, so all should have it
    const transformedUsers = (profiles || []).map((profile) => {
      const email = (profile.public_email || '').trim();
      
      return {
        id: profile.id,
        email: email,
        first_name: profile.first_name || '',
        last_name: profile.last_name || '',
      };
    });

    // Only include users with actual email addresses
    const usersWithEmails = transformedUsers.filter(user => user.email && user.email.length > 0);

    console.log('🔍 Users API: Transformed users:', { 
      totalProfiles: profiles?.length || 0,
      usersWithEmails: usersWithEmails.length 
    });

    return NextResponse.json({
      users: usersWithEmails,
      count: usersWithEmails.length,
    });

  } catch (error) {
    console.error('Profiles API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
