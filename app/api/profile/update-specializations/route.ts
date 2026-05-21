import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseService } from '@/lib/supabaseService';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { specializations } = body;

  if (!Array.isArray(specializations)) {
    return NextResponse.json({ error: 'specializations must be an array' }, { status: 400 });
  }

  const supabase = supabaseService();

  const { error } = await supabase
    .from('profiles')
    .update({ specializations })
    .eq('clerk_id', userId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
