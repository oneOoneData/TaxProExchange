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

    // Get total profiles count
    const { count: totalProfiles } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    // Get pending verifications count
    const { count: pendingVerifications } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('visibility_state', 'pending_verification');

    // Get verified profiles count
    const { count: verifiedProfiles } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('visibility_state', 'verified')
      .eq('is_listed', true);

    // Get total users count (from profiles table since that's where user accounts are)
    const { count: totalUsers } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    return NextResponse.json({
      totalProfiles: totalProfiles || 0,
      pendingVerifications: pendingVerifications || 0,
      verifiedProfiles: verifiedProfiles || 0,
      totalUsers: totalUsers || 0
    });

  } catch (error) {
    console.error('Admin stats error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
