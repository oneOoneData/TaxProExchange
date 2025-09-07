// Cookie helper functions for referral tracking

export const REFERRAL_COOKIE_NAME = 'tpx_ref';
export const REFERRAL_COOKIE_MAX_AGE = 7 * 24 * 60 * 60; // 7 days in seconds

export function setReferralCookie(slug: string): void {
  if (typeof document === 'undefined') return;
  
  const cookieValue = `slug=${slug}; path=/; max-age=${REFERRAL_COOKIE_MAX_AGE}; SameSite=Lax`;
  document.cookie = `${REFERRAL_COOKIE_NAME}=${cookieValue}`;
}

export function getReferralCookie(): string | null {
  if (typeof document === 'undefined') return null;
  
  const cookies = document.cookie.split(';');
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split('=');
    if (name === REFERRAL_COOKIE_NAME) {
      // Parse the value to extract the slug
      const match = value.match(/slug=([^;]+)/);
      return match ? match[1] : null;
    }
  }
  return null;
}

export function clearReferralCookie(): void {
  if (typeof document === 'undefined') return;
  
  document.cookie = `${REFERRAL_COOKIE_NAME}=; path=/; max-age=0`;
}

// Server-side cookie parsing for API routes
export function parseReferralCookie(cookieHeader: string | null): string | null {
  if (!cookieHeader) return null;
  
  const cookies = cookieHeader.split(';');
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split('=');
    if (name === REFERRAL_COOKIE_NAME) {
      const match = value.match(/slug=([^;]+)/);
      return match ? match[1] : null;
    }
  }
  return null;
}
