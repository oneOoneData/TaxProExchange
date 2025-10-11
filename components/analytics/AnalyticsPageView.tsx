'use client';

import { useEffect } from 'react';
import { trackEvent } from '@/lib/analytics';

interface AnalyticsPageViewProps {
  eventName: string;
  properties?: Record<string, any>;
}

/**
 * Client component to track page views on server-rendered pages
 * Place this component on any page that needs view tracking
 */
export default function AnalyticsPageView({ eventName, properties }: AnalyticsPageViewProps) {
  useEffect(() => {
    trackEvent(eventName, properties);
  }, [eventName, properties]);

  return null;
}

