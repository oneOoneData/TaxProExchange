import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

// Only protect specific routes, keep "/" public
const isProtectedRoute = createRouteMatcher([
  '/api/profile(.*)',
  '/join',
  '/profile(.*)',
  '/onboarding'
]);

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

  // For now, just let all protected routes pass through
  // We'll re-enable onboarding logic once the basic profile saving works
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
