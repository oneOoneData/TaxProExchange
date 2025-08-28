import { NextResponse, NextRequest } from 'next/server';
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

const isPublic = createRouteMatcher(['/', '/about', '/pricing', '/sign-in', '/sign-up', '/privacy', '/terms']);
const isOnboarding = createRouteMatcher(['/onboarding', '/profile/edit']);

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

  // Onboarding routes always allowed for signed-in users
  if (isOnboarding(req)) {
    response.headers.set('x-debug-redirect', 'none (onboarding)');
    return response;
  }

  // Check if onboarding is complete - try multiple cookie variations
  const onboardingComplete = 
    req.cookies.get('onboarding_complete')?.value === '1' ||
    req.cookies.get('onboarding_complete')?.value === 'true' ||
    req.headers.get('x-onboarding-complete') === '1';
  
  response.headers.set('x-debug-onboarding-check', onboardingComplete ? 'complete' : 'incomplete');
  
  if (!onboardingComplete) {
    // Only redirect if we're not already on the profile edit page
    if (pathname !== '/profile/edit') {
      response.headers.set('x-debug-redirect', 'profile/edit (incomplete)');
      return NextResponse.redirect(new URL('/profile/edit', req.url));
    }
  }

  response.headers.set('x-debug-redirect', 'none (complete)');
  return response;
});

export const config = {
  matcher: ['/api/(.*)', '/((?!_next|.*\\..*).*)'],
};
