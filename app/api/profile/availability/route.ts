import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseService } from '@/lib/supabaseService';

export async function PATCH(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { accepting_work } = await request.json();

    if (typeof accepting_work !== 'boolean') {
      return NextResponse.json({ error: 'Invalid accepting_work value' }, { status: 400 });
    }

    // Update the profile's accepting_work status
    const supabase = supabaseService();
    const { data, error } = await supabase
      .from('profiles')
      .update({ accepting_work })
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error updating availability:', error);
      return NextResponse.json({ error: 'Failed to update availability' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      accepting_work: data.accepting_work 
    });

  } catch (error) {
    console.error('Error in availability API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
