import { NextResponse } from 'next/server';
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

// Define what's public vs onboarding vs protected
const isPublic = createRouteMatcher(['/', '/about', '/pricing', '/join', '/sign-in', '/sign-up']);
const isOnboarding = createRouteMatcher(['/onboarding', '/profile/edit']);

export default clerkMiddleware(async (auth, req) => {
  const { userId, sessionId } = await auth(); // call synchronously inside clerkMiddleware

  // Always allow public
  if (isPublic(req)) {
    const res = NextResponse.next();
    res.headers.set('x-debug-public', '1');
    return res;
  }

  // If not signed in → let Clerk handle
  if (!userId || !sessionId) {
    const res = NextResponse.next();
    res.headers.set('x-debug-signed-in', '0');
    return res;
  }

  // Allow onboarding pages
  if (isOnboarding(req)) {
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
    res.headers.set('x-debug-domain', req.nextUrl.hostname);
    return res;
  }

  const res = NextResponse.next();
  res.headers.set('x-debug-cookie', cookieVal || 'missing');
  res.headers.set('x-debug-domain', req.nextUrl.hostname);
  return res;
});

export const config = {
  // exclude static files (anything with a dot), _next, and api
  matcher: ['/((?!_next|.*\\..*|api).*)'],
};
