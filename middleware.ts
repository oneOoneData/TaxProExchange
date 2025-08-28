import { NextResponse } from 'next/server';
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

// Define what's public vs onboarding vs protected
const isPublic = createRouteMatcher(['/', '/about', '/pricing', '/join', '/sign-in', '/sign-up']);
const isOnboarding = createRouteMatcher(['/onboarding', '/profile/edit']);

export default clerkMiddleware(async (auth, req) => {
  const { userId, sessionId } = await auth(); // MUST call auth()

  // Let public pages through completely
  if (isPublic(req)) return;

  // If not signed in, let Clerk handle it; don't force our own redirect
  if (!userId || !sessionId) return;

  // Already on onboarding pages? allow.
  if (isOnboarding(req)) return;

  // For all other protected routes, check if onboarding is complete
  const hasCookie = req.cookies.get('onboarding_complete')?.value === '1';
  if (!hasCookie) {
    return NextResponse.redirect(new URL('/profile/edit', req.url));
  }
  
  // Onboarding complete, allow access
  return;
});

export const config = {
  matcher: ['/((?!_next|.*\\..*|api).*)'],
};
