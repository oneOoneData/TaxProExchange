import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.warn('Supabase environment variables not configured');
}

const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

export async function POST(request: NextRequest) {
  try {
    // Check if Supabase is configured
    if (!supabase) {
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 503 }
      );
    }

    const { profile_id, licenses } = await request.json();

    if (!profile_id || !licenses || !Array.isArray(licenses)) {
      return NextResponse.json(
        { error: 'Invalid request data' },
        { status: 400 }
      );
    }

    // TODO: Add user authentication check here
    // For now, allow access to anyone (we'll secure this later)

    // Update profile status to pending verification
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        visibility_state: 'pending_verification',
        updated_at: new Date().toISOString()
      })
      .eq('id', profile_id);

    if (profileError) {
      console.error('Error updating profile:', profileError);
      return NextResponse.json(
        { error: 'Failed to update profile status' },
        { status: 500 }
      );
    }

    // Insert or update licenses
    const licensePromises = licenses.map(async (license) => {
      const { error } = await supabase
        .from('licenses')
        .upsert({
          profile_id,
          license_kind: license.license_kind,
          license_number: license.license_number,
          issuing_authority: license.issuing_authority,
          state: license.state || null,
          expires_on: license.expires_on || null,
          status: 'pending',
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'profile_id,license_kind,license_number'
        });

      return error;
    });

    const licenseErrors = await Promise.all(licensePromises);
    const hasLicenseErrors = licenseErrors.some(error => error !== null);

    if (hasLicenseErrors) {
      console.error('Some license updates failed:', licenseErrors);
      // Don't fail the whole operation if some license updates fail
    }

    // TODO: Send notification to admins about new verification request
    // TODO: Log verification submission in audit_logs table

    return NextResponse.json({
      success: true,
      message: 'Verification submitted successfully'
    });

  } catch (error) {
    console.error('Verification submission error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
