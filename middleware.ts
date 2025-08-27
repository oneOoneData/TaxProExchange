import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

const isProtectedRoute = createRouteMatcher([
  '/api/profile(.*)',
  '/join',
  '/profile(.*)'
]);

export default clerkMiddleware((auth, req) => {
  // Allow public routes to pass through
  if (!isProtectedRoute(req)) {
    return NextResponse.next();
  }

  // For protected routes, Clerk will handle auth automatically
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
