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

// Function to get user email from Clerk
async function getUserEmailFromClerk(clerkId: string): Promise<string | null> {
  try {
    const response = await fetch(`https://api.clerk.com/v1/users/${clerkId}`, {
      headers: {
        'Authorization': `Bearer ${process.env.CLERK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.warn(`Failed to fetch user ${clerkId} from Clerk:`, response.status);
      return null;
    }

    const userData = await response.json();
    
    // Extract email from the user data
    if (userData.primary_email_address_id && userData.email_addresses) {
      const primaryEmail = userData.email_addresses.find((e: any) => e.id === userData.primary_email_address_id);
      if (primaryEmail) {
        return primaryEmail.email_address;
      }
    }
    
    // Fallback to first email address
    if (userData.email_addresses && userData.email_addresses.length > 0) {
      return userData.email_addresses[0].email_address;
    }

    return null;
  } catch (error) {
    console.error(`Error fetching user ${clerkId} from Clerk:`, error);
    return null;
  }
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

    // TODO: Add admin role check here
    // For now, allow access to anyone (we'll secure this later)

    // Get profiles with pending verification status - include clerk_id to fetch emails
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select(`
        id,
        first_name,
        last_name,
        headline,
        bio,
        credential_type,
        firm_name,
        slug,
        created_at,
        clerk_id
      `)
      .eq('visibility_state', 'pending_verification')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching pending verifications:', error);
      return NextResponse.json(
        { error: 'Failed to fetch pending verifications' },
        { status: 500 }
      );
    }

    // Get licenses for each profile and fetch real emails
    const profilesWithLicenses = await Promise.all(
      profiles.map(async (profile) => {
        const { data: licenses } = await supabase
          .from('licenses')
          .select(`
            id,
            license_kind,
            license_number,
            issuing_authority,
            state,
            expires_on
          `)
          .eq('profile_id', profile.id);

        // Fetch real email from Clerk
        let email = 'No email available';
        if (profile.clerk_id) {
          const realEmail = await getUserEmailFromClerk(profile.clerk_id);
          if (realEmail) {
            email = realEmail;
          }
        }

        return {
          ...profile,
          email,
          licenses: licenses || []
        };
      })
    );

    return NextResponse.json({
      profiles: profilesWithLicenses
    });

  } catch (error) {
    console.error('Pending verifications error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
