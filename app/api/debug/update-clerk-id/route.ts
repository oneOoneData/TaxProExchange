import { NextRequest, NextResponse } from 'next/server';
import { supabaseService } from '@/lib/supabaseService';

export async function POST(request: NextRequest) {
  try {
    const { profileId, newClerkId } = await request.json();
    
    if (!profileId || !newClerkId) {
      return NextResponse.json({ error: 'Missing profileId or newClerkId' }, { status: 400 });
    }

    const supabase = supabaseService();
    
    // Update the clerk_user_id for the profile
    const { data, error } = await supabase
      .from('profiles')
      .update({ clerk_user_id: newClerkId })
      .eq('id', profileId)
      .select()
      .single();

    if (error) {
      console.error('Error updating clerk_user_id:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      profile: data,
      message: 'Clerk user ID updated successfully' 
    });
  } catch (error) {
    console.error('Error in update-clerk-id:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
