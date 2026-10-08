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
 * Shape of the first-touch acquisition data captured from the landing URL.
 */
export interface AcquisitionData {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  landing_src?: string;
}

const ACQUISITION_COOKIE_NAME = 'acquisition';

/**
 * Set the first-touch acquisition cookie (client-side). No-op if the cookie
 * already exists -- this is first-touch attribution, so a later landing
 * with different UTM params must never overwrite the original source.
 * @param data - UTM/src values read from the landing URL
 */
export function setAcquisitionCookie(data: AcquisitionData) {
  if (typeof document === 'undefined') return;
  if (getAcquisitionCookie()) return; // already captured -- first touch wins

  // Drop empty keys so the stored JSON only has what was actually present.
  const cleaned = Object.fromEntries(
    Object.entries(data).filter(([, v]) => !!v)
  );
  if (Object.keys(cleaned).length === 0) return;

  const value = encodeURIComponent(JSON.stringify(cleaned));
  document.cookie = `${ACQUISITION_COOKIE_NAME}=${value}; path=/; max-age=${90 * 24 * 60 * 60}; samesite=lax`;
}

/**
 * Get the acquisition cookie (client-side).
 * @returns Parsed acquisition data or null
 */
export function getAcquisitionCookie(): AcquisitionData | null {
  if (typeof document === 'undefined') return null;

  const cookies = document.cookie.split(';');
  for (let cookie of cookies) {
    const eqIndex = cookie.indexOf('=');
    if (eqIndex === -1) continue;
    const name = cookie.slice(0, eqIndex).trim();
    const value = cookie.slice(eqIndex + 1).trim();
    if (name === ACQUISITION_COOKIE_NAME) {
      try {
        return JSON.parse(decodeURIComponent(value));
      } catch {
        return null;
      }
    }
  }
  return null;
}

/**
 * Parse the acquisition cookie from a cookie header (server-side).
 * @param cookieHeader - Cookie header string
 * @returns Parsed acquisition data or null
 */
export function parseAcquisitionCookie(cookieHeader: string | null): AcquisitionData | null {
  if (!cookieHeader) return null;

  const cookies = cookieHeader.split(';');
  for (let cookie of cookies) {
    const eqIndex = cookie.indexOf('=');
    if (eqIndex === -1) continue;
    const name = cookie.slice(0, eqIndex).trim();
    const value = cookie.slice(eqIndex + 1).trim();
    if (name === ACQUISITION_COOKIE_NAME) {
      try {
        return JSON.parse(decodeURIComponent(value));
      } catch {
        return null;
      }
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