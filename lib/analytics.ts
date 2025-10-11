/**
 * Analytics event tracking for SEO → activation funnel
 * Stub implementation - wire up to your analytics provider
 */

export function trackEvent(eventName: string, properties?: Record<string, any>) {
  if (typeof window === 'undefined') return;

  // Google Analytics (gtag.js)
  if ((window as any).gtag) {
    (window as any).gtag('event', eventName, properties);
  }

  // Console log in development
  if (process.env.NODE_ENV === 'development') {
    console.log('[Analytics]', eventName, properties);
  }
}

// SEO-specific events
export const AnalyticsEvents = {
  VIEW_FOR_FIRMS: 'view_for_firms',
  VIEW_SOLUTION: 'view_solution',
  VIEW_SEARCH_PREFILTER: 'view_search_prefilter',
  CLICK_BROWSE_VERIFIED_PROS: 'click_browse_verified_pros',
  START_CONNECTION_REQUEST: 'start_connection_request',
} as const;

