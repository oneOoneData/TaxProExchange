import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseService } from '@/lib/supabaseService';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ user: null, profile: null });
    }

    const supabase = supabaseService();
    
    // Get user's profile with slug
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, slug')
      .eq('clerk_id', userId)
      .single();

    if (error || !profile) {
      return NextResponse.json({ user: { id: userId }, profile: null });
    }

    return NextResponse.json({ 
      user: { id: userId }, 
      profile: {
        id: profile.id,
        first_name: profile.first_name,
        last_name: profile.last_name,
        slug: profile.slug
      }
    });

  } catch (error) {
    console.error('Error fetching user profile:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
