import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

// Only protect specific routes, keep "/" public
const isProtectedRoute = createRouteMatcher([
  '/api/profile(.*)',
  '/join',
  '/profile(.*)',
  '/onboarding'
]);

const isOnboard = createRouteMatcher(['/onboarding', '/profile/edit']);

export default clerkMiddleware(async (auth, req) => {
  // Canonicalize apex → www to avoid SSO host flips
  if (req.nextUrl.hostname === 'taxproexchange.com') {
    const url = req.nextUrl.clone();
    url.hostname = 'www.taxproexchange.com';
    return NextResponse.redirect(url);
  }

  // Allow public routes to pass through (including "/")
  if (!isProtectedRoute(req)) {
    return NextResponse.next();
  }

  // For protected routes, check if user needs onboarding
  const { userId, sessionId } = await auth();
  
  // Not signed in? Let Clerk handle auth
  if (!userId || !sessionId) {
    return NextResponse.next();
  }

  // If already on onboarding pages, let it pass
  if (isOnboard(req)) {
    return NextResponse.next();
  }

  // Check if onboarding is complete via cookie
  const hasCookie = req.cookies.get('onboarding_complete')?.value === '1';
  if (!hasCookie) {
    return NextResponse.redirect(new URL('/profile/edit', req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    // Skip static files and images
    '/((?!_next/static|_next/image|favicon.ico|images|fonts).*)',
    // Always run on API routes
    '/api/(.*)',
  ],
};
