// /app/api/mark-onboarding-complete/route.ts
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const host = new URL(req.url).hostname;
  console.log(`[debug] Setting onboarding_complete cookie for host: ${host}`);

  const cookie: Parameters<typeof NextResponse.prototype.cookies.set>[2] = {
    path: '/',
    maxAge: 60 * 60 * 24 * 365, // 1 year
    httpOnly: false, // Changed from true to false so JavaScript can read it
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  };

  // Set domain based on environment
  if (host.endsWith('taxproexchange.com')) {
    cookie.domain = '.taxproexchange.com';
    console.log('[debug] Setting domain-scoped cookie for production');
  } else if (host === 'localhost' || host === '127.0.0.1') {
    // No domain for localhost - cookie will be host-only
    console.log('[debug] Setting host-only cookie for localhost');
  } else if (host.includes('vercel.app')) {
    // Vercel preview deployments
    cookie.domain = host;
    console.log('[debug] Setting domain-scoped cookie for Vercel preview');
  }

  const res = NextResponse.json({ 
    ok: true, 
    host,
    cookieDomain: cookie.domain || 'host-only',
    message: 'Onboarding marked as complete'
  });
  
  res.cookies.set('onboarding_complete', '1', cookie);
  
  // Add debug headers
  res.headers.set('x-debug-cookie-set', 'true');
  res.headers.set('x-debug-cookie-domain', cookie.domain || 'host-only');
  
  return res;
}
