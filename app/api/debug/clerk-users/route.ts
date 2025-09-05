import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    // Get some sample profiles with clerk_ids
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, clerk_id, public_email')
      .limit(5);

    if (profilesError) {
      return NextResponse.json({ error: 'Failed to fetch profiles', details: profilesError }, { status: 500 });
    }

    const results = [];

    for (const profile of profiles || []) {
      const debugInfo: any = {
        profile_id: profile.id,
        first_name: profile.first_name,
        last_name: profile.last_name,
        clerk_id: profile.clerk_id,
        public_email: profile.public_email
      };

      // Try to fetch from Clerk API
      try {
        const response = await fetch(`https://api.clerk.com/v1/users/${profile.clerk_id}`, {
          headers: {
            'Authorization': `Bearer ${process.env.CLERK_SECRET_KEY}`,
            'Content-Type': 'application/json',
          },
        });

        debugInfo.clerk_api_status = response.status;
        debugInfo.clerk_api_ok = response.ok;

        if (response.ok) {
          const userData = await response.json();
          debugInfo.clerk_user_data = {
            id: userData.id,
            email_addresses: userData.email_addresses?.map((e: any) => ({
              id: e.id,
              email_address: e.email_address,
              verification: e.verification
            })) || [],
            primary_email_address_id: userData.primary_email_address_id
          };

          // Extract email
          let userEmail: string | null = null;
          if (userData.primary_email_address_id && userData.email_addresses) {
            const primaryEmail = userData.email_addresses.find((e: any) => e.id === userData.primary_email_address_id);
            if (primaryEmail) {
              userEmail = primaryEmail.email_address;
            }
          } else if (userData.email_addresses && userData.email_addresses.length > 0) {
            userEmail = userData.email_addresses[0].email_address;
          }
          debugInfo.extracted_email = userEmail;
        } else {
          const errorText = await response.text();
          debugInfo.clerk_api_error = errorText;
        }
      } catch (error) {
        debugInfo.clerk_api_error = error instanceof Error ? error.message : 'Unknown error';
      }

      results.push(debugInfo);
    }

    return NextResponse.json({
      message: 'Clerk user debug info',
      results,
      total_profiles: profiles?.length || 0
    });

  } catch (error) {
    console.error('Debug error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
