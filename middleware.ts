import { NextResponse, NextRequest } from 'next/server';
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

const isPublic = createRouteMatcher(['/', '/about', '/pricing', '/sign-in', '/sign-up', '/legal(.*)']);
const isOnboarding = createRouteMatcher(['/onboarding', '/profile/edit', '/feedback']);
const isDashboard = createRouteMatcher(['/dashboard']);

export default clerkMiddleware(async (auth, req: NextRequest) => {
  const { userId, sessionId } = await auth();
  const hostname = req.nextUrl.hostname;
  const pathname = req.nextUrl.pathname;
  
  // Debug headers
  const response = NextResponse.next();
  response.headers.set('x-debug-host', hostname);
  response.headers.set('x-debug-path', pathname);
  response.headers.set('x-debug-cookie', req.cookies.get('onboarding_complete')?.value || 'missing');
  response.headers.set('x-debug-user-id', userId || 'none');
  response.headers.set('x-debug-session-id', sessionId || 'none');

  // Localhost bypass for development
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    response.headers.set('x-debug-bypass', 'localhost');
    return response;
  }

  // API routes bypass - let them handle their own auth
  if (pathname.startsWith('/api/')) {
    response.headers.set('x-debug-bypass', 'api-route');
    return response;
  }

  // Public routes always allowed
  if (isPublic(req)) {
    response.headers.set('x-debug-redirect', 'none (public)');
    return response;
  }

  // No user - allow (will be handled by Clerk auth)
  if (!userId || !sessionId) {
    response.headers.set('x-debug-redirect', 'none (no user)');
    return response;
  }

  // Dashboard routes always allowed for signed-in users
  if (isDashboard(req)) {
    response.headers.set('x-debug-redirect', 'none (dashboard)');
    return response;
  }

  // Onboarding routes always allowed for signed-in users
  if (isOnboarding(req)) {
    response.headers.set('x-debug-redirect', 'none (onboarding)');
    return response;
  }

  // Check if onboarding is complete
  const onboardingComplete = req.cookies.get('onboarding_complete')?.value === '1';
  response.headers.set('x-debug-onboarding-check', onboardingComplete ? 'complete' : 'incomplete');
  
  // If onboarding is not complete, redirect to profile edit
  if (!onboardingComplete) {
    response.headers.set('x-debug-redirect', 'profile/edit (incomplete)');
    return NextResponse.redirect(new URL('/profile/edit', req.url));
  }

  response.headers.set('x-debug-redirect', 'none (complete)');
  return response;
});

export const config = {
  matcher: ['/((?!_next|.*\\..*).*)'],
};
