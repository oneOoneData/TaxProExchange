import { NextRequest, NextResponse } from 'next/server';
import { supabaseService } from '@/lib/supabaseService';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug');
    
    if (!slug) {
      return NextResponse.json(
        { error: 'Slug parameter is required' },
        { status: 400 }
      );
    }

    const supabase = supabaseService();
    
    // Search for profiles with this slug
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('id, slug, first_name, last_name, visibility_state, is_listed, created_at')
      .eq('slug', slug);

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Database error', details: error.message },
        { status: 500 }
      );
    }

    // Also search for similar slugs (in case there's a slight mismatch)
    const { data: similarProfiles, error: similarError } = await supabase
      .from('profiles')
      .select('id, slug, first_name, last_name, visibility_state, is_listed, created_at')
      .ilike('slug', `%${slug}%`)
      .limit(10);

    return NextResponse.json({
      requested_slug: slug,
      exact_matches: profiles || [],
      similar_matches: similarProfiles || [],
      total_exact: profiles?.length || 0,
      total_similar: similarProfiles?.length || 0
    });

  } catch (error) {
    console.error('Debug endpoint error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
