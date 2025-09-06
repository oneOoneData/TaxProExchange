import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function supabaseService() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

export async function POST() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = supabaseService();
    
    // Get all profiles
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, clerk_id, first_name, last_name, public_email, created_at')
      .order('created_at', { ascending: false });

    if (profilesError) {
      return NextResponse.json({ 
        error: 'Failed to fetch profiles', 
        details: profilesError.message 
      }, { status: 500 });
    }

    console.log(`🔍 Found ${profiles.length} profiles to check`);

    const orphanedProfiles = [];
    const activeProfiles = [];

    // Check each profile against Clerk
    for (const profile of profiles) {
      try {
        const clerkResponse = await fetch(`https://api.clerk.com/v1/users/${profile.clerk_id}`, {
          headers: {
            'Authorization': `Bearer ${process.env.CLERK_SECRET_KEY}`,
            'Content-Type': 'application/json',
          },
        });
        
        if (clerkResponse.ok) {
          activeProfiles.push(profile);
        } else if (clerkResponse.status === 404) {
          orphanedProfiles.push(profile);
        } else {
          console.error(`❌ Unexpected Clerk response for ${profile.clerk_id}:`, clerkResponse.status);
        }
      } catch (error) {
        console.error(`❌ Error checking profile ${profile.clerk_id}:`, error);
      }
    }

    console.log(`🔍 Found ${orphanedProfiles.length} orphaned profiles`);
    console.log(`🔍 Found ${activeProfiles.length} active profiles`);

    return NextResponse.json({
      success: true,
      totalProfiles: profiles.length,
      orphanedProfiles: orphanedProfiles.map(p => ({
        id: p.id,
        clerk_id: p.clerk_id,
        name: `${p.first_name} ${p.last_name}`,
        email: p.public_email,
        created_at: p.created_at
      })),
      activeProfiles: activeProfiles.length,
      orphanedCount: orphanedProfiles.length
    });

  } catch (error) {
    console.error('Cleanup endpoint error:', error);
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Endpoint to actually delete orphaned profiles
export async function DELETE() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = supabaseService();
    
    // Get all profiles
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, clerk_id, first_name, last_name, public_email, created_at');

    if (profilesError) {
      return NextResponse.json({ 
        error: 'Failed to fetch profiles', 
        details: profilesError.message 
      }, { status: 500 });
    }

    const orphanedProfiles = [];
    const deletedProfiles = [];

    // Check each profile against Clerk
    for (const profile of profiles) {
      try {
        const clerkResponse = await fetch(`https://api.clerk.com/v1/users/${profile.clerk_id}`, {
          headers: {
            'Authorization': `Bearer ${process.env.CLERK_SECRET_KEY}`,
            'Content-Type': 'application/json',
          },
        });
        
        if (clerkResponse.status === 404) {
          orphanedProfiles.push(profile);
        }
      } catch (error) {
        console.error(`❌ Error checking profile ${profile.clerk_id}:`, error);
      }
    }

    // Delete orphaned profiles
    for (const profile of orphanedProfiles) {
      try {
        const { error: deleteError } = await supabase
          .from('profiles')
          .delete()
          .eq('id', profile.id);
          
        if (deleteError) {
          console.error(`❌ Error deleting profile ${profile.id}:`, deleteError);
        } else {
          deletedProfiles.push(profile);
          console.log(`✅ Deleted orphaned profile: ${profile.first_name} ${profile.last_name} (${profile.clerk_id})`);
        }
      } catch (error) {
        console.error(`❌ Error deleting profile ${profile.id}:`, error);
      }
    }

    return NextResponse.json({
      success: true,
      deletedCount: deletedProfiles.length,
      deletedProfiles: deletedProfiles.map(p => ({
        id: p.id,
        clerk_id: p.clerk_id,
        name: `${p.first_name} ${p.last_name}`,
        email: p.public_email
      }))
    });

  } catch (error) {
    console.error('Delete endpoint error:', error);
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
