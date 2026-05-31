import { NextResponse } from 'next/server';
import { createServerClient } from '../../lib/supabase/server';

export async function GET() {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ hasAccess: false });

  const { data: access } = await supabase
    .from('practice_buyer_access')
    .select('access_end, status')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .gt('access_end', new Date().toISOString())
    .single();

  return NextResponse.json({
    hasAccess: !!access,
    accessEnd: access?.access_end || null,
  });
}
