import { NextResponse, NextRequest } from 'next/server';
import { auth } from '@clerk/nextjs/server';

const PUBLIC_PATHS = new Set(['/', '/about', '/pricing']);
const ONBOARDING_PATHS = new Set(['/onboarding', '/profile/edit']);

export default async function middleware(req: NextRequest) {
  const url = req.nextUrl;
  const pathname = url.pathname;

  // Always allow public
  if (PUBLIC_PATHS.has(pathname)) {
    const res = NextResponse.next();
    res.headers.set('x-debug-public', '1');
    return res;
  }

  // Auth (must await in middleware without Clerk wrapper)
  const { userId, sessionId } = await auth();
  if (!userId || !sessionId) {
    const res = NextResponse.next();
    res.headers.set('x-debug-signed-in', '0');
    return res;
  }

  // Allow onboarding pages
  if (ONBOARDING_PATHS.has(pathname)) {
    const res = NextResponse.next();
    res.headers.set('x-debug-onboarding-page', '1');
    return res;
  }

  // Gate by cookie
  const cookieVal = req.cookies.get('onboarding_complete')?.value ?? '';
  const hasCookie = cookieVal === '1';

  if (!hasCookie) {
    const redirectUrl = new URL('/profile/edit', req.url);
    const res = NextResponse.redirect(redirectUrl);
    res.headers.set('x-debug-redirect', 'profile-edit');
    res.headers.set('x-debug-cookie', cookieVal || 'missing');
    res.headers.set('x-debug-domain', url.hostname);
    return res;
  }

  const res = NextResponse.next();
  res.headers.set('x-debug-cookie', cookieVal || 'missing');
  res.headers.set('x-debug-domain', url.hostname);
  return res;
}

// Keep matcher narrow: don't catch /api or static
export const config = {
  matcher: ['/((?!_next|.*\\..*|api).*)'],
};
