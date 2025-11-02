import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseService } from '@/lib/supabaseService';

export const dynamic = 'force-dynamic';

// POST /api/ai-votes - Toggle vote for a tool (authenticated only)
export async function POST(request: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { tool_id } = body;

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
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // Check if vote already exists
    const { data: existingVote, error: checkError } = await supabase
      .from('ai_votes')
      .select('id')
      .eq('tool_id', tool_id)
      .eq('user_id', profile.id)
      .maybeSingle();

    if (checkError) {
      console.error('Error checking existing vote:', checkError);
      return NextResponse.json({ error: 'Failed to check vote' }, { status: 500 });
    }

    if (existingVote) {
      // Remove vote (unvote)
      const { error: deleteError } = await supabase
        .from('ai_votes')
        .delete()
        .eq('id', existingVote.id);

      if (deleteError) {
        console.error('Error deleting vote:', deleteError);
        return NextResponse.json({ error: 'Failed to remove vote' }, { status: 500 });
      }

      // Get updated vote count
      const { count } = await supabase
        .from('ai_votes')
        .select('*', { count: 'exact', head: true })
        .eq('tool_id', tool_id);

      return NextResponse.json({ 
        voted: false, 
        votes: count || 0 
      });
    } else {
      // Add vote
      const { error: insertError } = await supabase
        .from('ai_votes')
        .insert({
          tool_id,
          user_id: profile.id,
          vote: 1,
        });

      if (insertError) {
        console.error('Error inserting vote:', insertError);
        return NextResponse.json({ error: 'Failed to add vote' }, { status: 500 });
      }

      // Get updated vote count
      const { count } = await supabase
        .from('ai_votes')
        .select('*', { count: 'exact', head: true })
        .eq('tool_id', tool_id);

      return NextResponse.json({ 
        voted: true, 
        votes: count || 0 
      });
    }
  } catch (error) {
    console.error('Error in POST /api/ai-votes:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

