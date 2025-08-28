// /app/api/mark-onboarding-complete/route.ts
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

export const dynamic = 'force-dynamic';

export async function POST() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set('onboarding_complete', '1', {
    path: '/',
    maxAge: 60 * 60 * 24 * 365, // 1 year
    httpOnly: false, // middleware can read
    sameSite: 'lax',
  });
  return res;
}
