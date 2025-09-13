import { NextRequest, NextResponse } from 'next/server';

/**
 * Cross-subdomain cookie configuration
 */
export const COOKIE_CONFIG = {
  domain: '.taxproexchange.com',
  secure: process.env.NODE_ENV === 'production',
  httpOnly: true,
  sameSite: 'lax' as const,
  path: '/',
};

/**
 * Set a cross-subdomain cookie on the server side
 * @param name - Cookie name
 * @param value - Cookie value
 * @param maxAge - Max age in seconds (default: 30 days)
 * @param response - NextResponse object to set cookie on
 */
export function setCrossSubdomainCookie(
  name: string,
  value: string,
  response: NextResponse,
  maxAge: number = 30 * 24 * 60 * 60 // 30 days
) {
  response.cookies.set(name, value, {
    ...COOKIE_CONFIG,
    maxAge,
  });
}

/**
 * Set a cross-subdomain cookie in a NextResponse
 * @param response - NextResponse object
 * @param name - Cookie name
 * @param value - Cookie value
 * @param maxAge - Max age in seconds (default: 30 days)
 */
export function setCrossSubdomainCookieInResponse(
  response: NextResponse,
  name: string,
  value: string,
  maxAge: number = 30 * 24 * 60 * 60 // 30 days
) {
  response.cookies.set(name, value, {
    ...COOKIE_CONFIG,
    maxAge,
  });
  return response;
}

/**
 * Get a cookie value from a request
 * @param request - NextRequest object
 * @param name - Cookie name
 * @returns Cookie value or undefined
 */
export function getCookie(request: NextRequest, name: string): string | undefined {
  return request.cookies.get(name)?.value;
}

/**
 * Set referral cookie (client-side)
 * @param refSlug - Referral slug
 */
export function setReferralCookie(refSlug: string) {
  if (typeof document !== 'undefined') {
    document.cookie = `referral=${refSlug}; path=/; max-age=${30 * 24 * 60 * 60}; samesite=lax`;
  }
}

/**
 * Get referral cookie (client-side)
 * @returns Referral slug or null
 */
export function getReferralCookie(): string | null {
  if (typeof document === 'undefined') return null;
  
  const cookies = document.cookie.split(';');
  for (let cookie of cookies) {
    const [name, value] = cookie.trim().split('=');
    if (name === 'referral') {
      return value;
    }
  }
  return null;
}

/**
 * Parse referral cookie from cookie header (server-side)
 * @param cookieHeader - Cookie header string
 * @returns Referral slug or null
 */
export function parseReferralCookie(cookieHeader: string | null): string | null {
  if (!cookieHeader) return null;
  
  const cookies = cookieHeader.split(';');
  for (let cookie of cookies) {
    const [name, value] = cookie.trim().split('=');
    if (name === 'referral') {
      return value;
    }
  }
  return null;
}

/**
 * Delete a cross-subdomain cookie in a NextResponse
 * @param response - NextResponse object
 * @param name - Cookie name
 */
export function deleteCrossSubdomainCookieInResponse(
  response: NextResponse,
  name: string
) {
  response.cookies.set(name, '', {
    ...COOKIE_CONFIG,
    maxAge: 0,
  });
  return response;
}