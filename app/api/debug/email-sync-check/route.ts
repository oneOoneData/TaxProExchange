import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.warn('Supabase environment variables not configured');
}

const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

// Function to get all users from Clerk
async function getAllClerkUsers(): Promise<any[]> {
  try {
    const response = await fetch('https://api.clerk.com/v1/users?limit=500', {
      headers: {
        'Authorization': `Bearer ${process.env.CLERK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Clerk API error: ${response.status}`);
    }

    const data = await response.json();
    return data.data || [];
  } catch (error) {
    console.error('Error fetching Clerk users:', error);
    return [];
  }
}

// Function to get all profiles from database
async function getAllProfiles(): Promise<any[]> {
  if (!supabase) {
    throw new Error('Supabase not configured');
  }

  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('id, first_name, last_name, public_email, clerk_id, is_deleted, created_at')
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Database error: ${error.message}`);
  }

  return profiles || [];
}

export async function GET(request: NextRequest) {
  try {
    // Check if Supabase is configured
    if (!supabase) {
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 503 }
      );
    }

    console.log('🔍 Starting email sync check...');

    // Get all users from Clerk
    console.log('📧 Fetching users from Clerk...');
    const clerkUsers = await getAllClerkUsers();
    console.log(`Found ${clerkUsers.length} users in Clerk`);

    // Get all profiles from database
    console.log('🗄️ Fetching profiles from database...');
    const profiles = await getAllProfiles();
    console.log(`Found ${profiles.length} profiles in database`);

    // Create maps for easier comparison
    const clerkUserMap = new Map();
    const clerkEmailMap = new Map();
    
    clerkUsers.forEach(user => {
      const userId = user.id;
      const emails = user.email_addresses?.map((e: any) => e.email_address) || [];
      const primaryEmail = user.primary_email_address_id 
        ? user.email_addresses?.find((e: any) => e.id === user.primary_email_address_id)?.email_address
        : emails[0];

      clerkUserMap.set(userId, {
        id: userId,
        emails,
        primaryEmail,
        firstName: user.first_name,
        lastName: user.last_name,
        createdAt: user.created_at
      });

      // Map each email to the user
      emails.forEach(email => {
        clerkEmailMap.set(email, userId);
      });
    });

    // Analyze profiles
    const analysis = {
      totalClerkUsers: clerkUsers.length,
      totalProfiles: profiles.length,
      activeProfiles: profiles.filter(p => !p.is_deleted).length,
      deletedProfiles: profiles.filter(p => p.is_deleted).length,
      mismatches: [],
      orphanedProfiles: [],
      missingProfiles: [],
      emailMismatches: []
    };

    // Check each profile
    profiles.forEach(profile => {
      const clerkId = profile.clerk_id;
      const profileEmail = profile.public_email;

      // Check if profile has a clerk_id
      if (!clerkId) {
        analysis.orphanedProfiles.push({
          type: 'no_clerk_id',
          profile: {
            id: profile.id,
            name: `${profile.first_name} ${profile.last_name}`,
            email: profileEmail,
            created_at: profile.created_at
          }
        });
        return;
      }

      // Check if clerk_id exists in Clerk
      const clerkUser = clerkUserMap.get(clerkId);
      if (!clerkUser) {
        analysis.orphanedProfiles.push({
          type: 'clerk_user_not_found',
          profile: {
            id: profile.id,
            clerk_id: clerkId,
            name: `${profile.first_name} ${profile.last_name}`,
            email: profileEmail,
            created_at: profile.created_at
          }
        });
        return;
      }

      // Check email mismatch
      if (profileEmail && clerkUser.primaryEmail && profileEmail !== clerkUser.primaryEmail) {
        analysis.emailMismatches.push({
          profile: {
            id: profile.id,
            name: `${profile.first_name} ${profile.last_name}`,
            email: profileEmail
          },
          clerk: {
            id: clerkUser.id,
            name: `${clerkUser.firstName} ${clerkUser.lastName}`,
            email: clerkUser.primaryEmail
          }
        });
      }
    });

    // Check for Clerk users without profiles
    clerkUsers.forEach(clerkUser => {
      const hasProfile = profiles.some(p => p.clerk_id === clerkUser.id);
      if (!hasProfile) {
        analysis.missingProfiles.push({
          clerk: {
            id: clerkUser.id,
            name: `${clerkUser.first_name} ${clerkUser.last_name}`,
            email: clerkUser.primary_email_address_id 
              ? clerkUser.email_addresses?.find((e: any) => e.id === clerkUser.primary_email_address_id)?.email_address
              : clerkUser.email_addresses?.[0]?.email_address,
            created_at: clerkUser.created_at
          }
        });
      }
    });

    console.log('✅ Email sync check completed');
    console.log(`📊 Results: ${analysis.orphanedProfiles.length} orphaned profiles, ${analysis.missingProfiles.length} missing profiles, ${analysis.emailMismatches.length} email mismatches`);

    return NextResponse.json({
      success: true,
      analysis,
      summary: {
        totalClerkUsers: analysis.totalClerkUsers,
        totalProfiles: analysis.totalProfiles,
        activeProfiles: analysis.activeProfiles,
        deletedProfiles: analysis.deletedProfiles,
        orphanedProfiles: analysis.orphanedProfiles.length,
        missingProfiles: analysis.missingProfiles.length,
        emailMismatches: analysis.emailMismatches.length
      }
    });

  } catch (error) {
    console.error('Email sync check error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
