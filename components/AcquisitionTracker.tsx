'use client';

import { useEffect } from 'react';
import { setAcquisitionCookie } from '@/lib/cookies';

/**
 * Mounted once in the root layout. On first paint of any page, reads
 * utm_source / utm_medium / utm_campaign / our own ?src= tag off the URL
 * and stores them in a first-touch cookie (lib/cookies.ts enforces the
 * "don't overwrite if already set" rule). Renders nothing.
 *
 * app/api/profile/route.ts reads this cookie server-side when a new
 * profile row is created, so a signup's source survives to the DB even
 * though the landing page and the signup page are usually different pages.
 */
export default function AcquisitionTracker() {
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      setAcquisitionCookie({
        utm_source: params.get('utm_source') || undefined,
        utm_medium: params.get('utm_medium') || undefined,
        utm_campaign: params.get('utm_campaign') || undefined,
        landing_src: params.get('src') || undefined,
      });
    } catch {
      // Non-fatal -- acquisition tracking must never break page rendering.
    }
  }, []);

  return null;
}
