'use client';

import { Inter } from 'next/font/google';
import { ClerkProvider } from '@clerk/nextjs';
import Footer from '@/components/Footer';
import Analytics from '@/components/Analytics';
import CanonicalUrl from '@/components/CanonicalUrl';
import { getOrganizationJsonLd, getWebsiteJsonLd } from '@/lib/seo';
import { useEffect, useState } from 'react';

const inter = Inter({ subsets: ['latin'] });

// Google Analytics Measurement IDs
const GA_MEASUREMENT_ID_SITE = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID_SITE || 'G-KP6ZHRKKS5';
const GA_MEASUREMENT_ID_APP = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID_APP;

interface DomainAwareLayoutProps {
  children: React.ReactNode;
}

export default function DomainAwareLayout({ children }: DomainAwareLayoutProps) {
  const [isApp, setIsApp] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    if (typeof window !== 'undefined') {
      setIsApp(window.location.hostname === 'app.taxproexchange.com');
    }
  }, []);

  // Show loading state during hydration
  if (!isClient) {
    return (
      <html lang="en">
        <body className={inter.className}>
          <div>Loading...</div>
        </body>
      </html>
    );
  }

  if (isApp) {
    // App layout - noindex, nofollow, separate analytics
    return (
      <html lang="en">
        <head>
          <meta name="robots" content="noindex, nofollow" />
          <meta name="googlebot" content="noindex, nofollow" />
          <meta name="bingbot" content="noindex, nofollow" />
          {GA_MEASUREMENT_ID_APP && (
            <Analytics measurementId={GA_MEASUREMENT_ID_APP} />
          )}
        </head>
        <body className={inter.className}>
          <ClerkProvider signInUrl="/sign-in" signUpUrl="/sign-up">
            {children}
            <Footer />
          </ClerkProvider>
        </body>
      </html>
    );
  }

  // Marketing layout - SEO optimized
  return (
    <html lang="en">
      <head>
        {/* Canonical URL - will be set dynamically per page */}
        <link rel="canonical" href="https://www.taxproexchange.com" />
        
        {/* JSON-LD Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(getOrganizationJsonLd()),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(getWebsiteJsonLd()),
          }}
        />
        
        {/* Google Analytics */}
        <Analytics measurementId={GA_MEASUREMENT_ID_SITE} />
      </head>
      <body className={inter.className}>
        <CanonicalUrl />
        <ClerkProvider signInUrl="/sign-in" signUpUrl="/sign-up">
          {children}
          <Footer />
        </ClerkProvider>
      </body>
    </html>
  );
}
