'use client';

import { usePathname } from 'next/navigation';
import { absoluteCanonicalFromPath } from '@/lib/seo';
import { useEffect } from 'react';

export default function CanonicalUrl() {
  const pathname = usePathname();
  
  useEffect(() => {
    // Update the canonical link in the head
    const canonicalUrl = absoluteCanonicalFromPath(pathname);
    
    // Remove existing canonical link
    const existingCanonical = document.querySelector('link[rel="canonical"]');
    if (existingCanonical) {
      existingCanonical.remove();
    }
    
    // Add new canonical link
    const canonicalLink = document.createElement('link');
    canonicalLink.rel = 'canonical';
    canonicalLink.href = canonicalUrl;
    document.head.appendChild(canonicalLink);
  }, [pathname]);
  
  return null;
}
