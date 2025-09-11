import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    // Get query parameters for date range
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '30');
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Query to get user signups per day
    const { data: signupData, error } = await supabase
      .from('profiles')
      .select('created_at')
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching signup data:', error);
      return NextResponse.json({ error: 'Failed to fetch signup data' }, { status: 500 });
    }

    // Group signups by day using consistent timezone handling
    const signupsByDay: { [key: string]: number } = {};
    
    signupData?.forEach(profile => {
      // Convert to local date string consistently
      const date = new Date(profile.created_at);
      const dateStr = date.toLocaleDateString('en-CA'); // YYYY-MM-DD format
      signupsByDay[dateStr] = (signupsByDay[dateStr] || 0) + 1;
    });

    // Fill in missing days with 0 using the same timezone logic
    const result = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toLocaleDateString('en-CA'); // YYYY-MM-DD format
      result.push({
        date: dateStr,
        signups: signupsByDay[dateStr] || 0
      });
    }

    // Calculate total signups and average
    const totalSignups = result.reduce((sum, day) => sum + day.signups, 0);
    const averageSignups = Math.round((totalSignups / days) * 10) / 10;
    
    // Find peak day
    const peakDay = result.reduce((max, day) => day.signups > max.signups ? day : max, result[0] || { signups: 0 });

    return NextResponse.json({
      success: true,
      data: {
        signupsByDay: result,
        totalSignups,
        averageSignups,
        peakDay: peakDay.signups,
        period: `${days} days`,
        debug: {
          rawSignupCount: signupData?.length || 0,
          calculatedTotal: totalSignups
        }
      }
    });

  } catch (error) {
    console.error('Analytics API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

