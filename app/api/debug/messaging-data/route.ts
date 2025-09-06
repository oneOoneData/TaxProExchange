import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Initialize Supabase client with service role key to bypass RLS
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.warn('Supabase environment variables not configured');
}

const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

export async function GET() {
  try {
    // Check if Supabase is configured
    if (!supabase) {
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 503 }
      );
    }

    // Get basic connection counts
    const { data: connectionCounts, error: connectionError } = await supabase
      .from('connections')
      .select('status')
      .then(({ data, error }) => {
        if (error) throw error;
        const counts = data.reduce((acc, conn) => {
          acc[conn.status] = (acc[conn.status] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);
        return { data: counts, error: null };
      });

    if (connectionError) {
      throw connectionError;
    }

    // Get detailed connection data
    const { data: connections, error: connectionsError } = await supabase
      .from('connections')
      .select(`
        id,
        status,
        created_at,
        stream_channel_id,
        requester_profile_id,
        recipient_profile_id,
        requester:profiles!connections_requester_profile_id_fkey(
          first_name,
          last_name,
          credential_type,
          firm_name
        ),
        recipient:profiles!connections_recipient_profile_id_fkey(
          first_name,
          last_name,
          credential_type,
          firm_name
        )
      `)
      .order('created_at', { ascending: false })
      .limit(20);

    if (connectionsError) {
      throw connectionsError;
    }

    // Get profile counts
    const { count: totalProfiles, error: totalError } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    const { count: listedProfiles, error: listedError } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('is_listed', true);

    const { count: verifiedProfiles, error: verifiedError } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('visibility_state', 'verified');

    // Format the data for easy reading
    const formattedConnections = connections?.map(conn => ({
      connection_id: conn.id,
      status: conn.status,
      created_at: conn.created_at,
      stream_channel_id: conn.stream_channel_id,
      requester_name: conn.requester ? `${conn.requester.first_name} ${conn.requester.last_name}` : 'Unknown',
      requester_type: conn.requester?.credential_type || 'Unknown',
      requester_firm: conn.requester?.firm_name || 'N/A',
      recipient_name: conn.recipient ? `${conn.recipient.first_name} ${conn.recipient.last_name}` : 'Unknown',
      recipient_type: conn.recipient?.credential_type || 'Unknown',
      recipient_firm: conn.recipient?.firm_name || 'N/A',
      messaging_status: conn.stream_channel_id ? '✅ Can message' : 
                       conn.status === 'accepted' ? '❌ No messaging channel' : 
                       '⏳ Pending acceptance'
    })) || [];

    return NextResponse.json({
      summary: {
        connection_counts: connectionCounts,
        profile_counts: {
          total: totalProfiles || 0,
          listed: listedProfiles || 0,
          verified: verifiedProfiles || 0
        }
      },
      recent_connections: formattedConnections,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Debug messaging data error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch messaging data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
