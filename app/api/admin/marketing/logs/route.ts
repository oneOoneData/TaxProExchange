import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    // Get email logs ordered by most recent first
    const { data: logs, error } = await supabase
      .from('email_log')
      .select('*')
      .order('sent_at', { ascending: false })
      .limit(50); // Limit to last 50 emails

    if (error) {
      console.error('Error fetching email logs:', error);
      return NextResponse.json(
        { error: 'Failed to fetch email logs' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      logs: logs || [],
      count: logs?.length || 0,
    });

  } catch (error) {
    console.error('Email logs API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
