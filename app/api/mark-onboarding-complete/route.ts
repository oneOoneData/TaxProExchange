// /app/api/mark-onboarding-complete/route.ts
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const url = new URL(req.url);
  const host = url.hostname; // e.g. www.taxproexchange.com or *.vercel.app
  // Use apex-wide cookie in prod; in preview, set to the preview hostname
  const cookieDomain = host.endsWith('taxproexchange.com')
    ? '.taxproexchange.com'
    : host; // e.g. taxproexchange-git-xyz.vercel.app

  const res = NextResponse.json({ ok: true, domain: cookieDomain });

  // Clear any old cookies that might conflict (host-scoped or wrong domain)
  // host-scoped
  res.cookies.set('onboarding_complete', '', {
    path: '/',
    maxAge: 0,
    sameSite: 'lax',
    secure: true,
  });
  // apex-scoped (prod)
  res.cookies.set('onboarding_complete', '', {
    path: '/',
    domain: '.taxproexchange.com',
    maxAge: 0,
    sameSite: 'lax',
    secure: true,
  });

  // Now set the good one
  res.cookies.set('onboarding_complete', '1', {
    path: '/',
    domain: cookieDomain,
    maxAge: 60 * 60 * 24 * 365,
    httpOnly: true,      // flip to false temporarily only if you need to inspect via document.cookie
    sameSite: 'lax',
    secure: true,
  });

  return res;
}
