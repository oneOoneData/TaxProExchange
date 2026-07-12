import { NextRequest, NextResponse } from 'next/server';
import { supabaseService } from '@/lib/supabaseService';
import { requireAdmin } from '@/lib/adminAuth';

export async function POST(request: NextRequest) {
  const authResult = await requireAdmin();
  if (authResult instanceof NextResponse) return authResult;

  try {
    const { profileId, newClerkId } = await request.json();
    if (!profileId || !newClerkId) {
      return NextResponse.json({ error: 'Missing profileId or newClerkId' }, { status: 400 });
    }
    const supabase = supabaseService();
    const { data, error } = await supabase
      .from('profiles')
      .update({ clerk_user_id: newClerkId })
      .eq('id', profileId)
      .select()
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true, profile: data });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
