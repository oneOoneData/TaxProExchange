import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { auth } from '@clerk/nextjs/server';

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ hasAccess: false });

  const supabase = createServerClient();
  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('clerk_id', userId)
    .single();

  if (!profile) return NextResponse.json({ hasAccess: false });

  const { data: access } = await supabase
    .from('practice_buyer_access')
    .select('access_end')
    .eq('user_id', profile.id)
    .eq('status', 'active')
    .gt('access_end', new Date().toISOString())
    .single();

  return NextResponse.json({
    hasAccess: !!access,
    accessEnd: access?.access_end || null,
  });
}
