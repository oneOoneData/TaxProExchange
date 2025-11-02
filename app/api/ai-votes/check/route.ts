import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseService } from '@/lib/supabaseService';

export const dynamic = 'force-dynamic';

// GET /api/ai-votes/check - Check if user has voted for a tool
export async function GET(request: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ voted: false });
    }

    const { searchParams } = new URL(request.url);
    const tool_id = searchParams.get('tool_id');

    if (!tool_id) {
      return NextResponse.json({ error: 'tool_id is required' }, { status: 400 });
    }

    const supabase = supabaseService();

    // Get user's profile ID
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .or(`clerk_id.eq.${userId},clerk_user_id.eq.${userId}`)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ voted: false });
    }

    // Check if vote exists
    const { data: vote, error } = await supabase
      .from('ai_votes')
      .select('id')
      .eq('tool_id', tool_id)
      .eq('user_id', profile.id)
      .maybeSingle();

    if (error) {
      console.error('Error checking vote:', error);
      return NextResponse.json({ voted: false });
    }

    return NextResponse.json({ voted: !!vote });
  } catch (error) {
    console.error('Error in GET /api/ai-votes/check:', error);
    return NextResponse.json({ voted: false });
  }
}

