'use client';

import { Inter } from 'next/font/google';
import { ClerkProvider } from '@clerk/nextjs';
import dynamic from 'next/dynamic';
import Analytics from '@/components/Analytics';
import { getOrganizationJsonLd, getWebsiteJsonLd } from '@/lib/seo';
import { useEffect, useState } from 'react';

// Disable SSR for ALL components that might cause hydration issues
const Footer = dynamic(() => import('@/components/Footer'), { ssr: false });
const CanonicalUrl = dynamic(() => import('@/components/CanonicalUrl'), { ssr: false });
const AppNavigation = dynamic(() => import('@/components/AppNavigation'), { ssr: false });
const MobileBottomNav = dynamic(() => import('@/components/MobileBottomNav'), { ssr: false });

// Real viewport height hook for mobile browsers
function useRealVH() {
  useEffect(() => {
    const setVH = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty("--vh", `${vh}px`);
    };
    setVH();
    window.addEventListener("resize", setVH);
    return () => window.removeEventListener("resize", setVH);
  }, []);
}

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
  const [currentPath, setCurrentPath] = useState('');

  // Set up real viewport height for mobile browsers
  useRealVH();

  useEffect(() => {
    setIsClient(true);
    if (typeof window !== 'undefined') {
      const isAppDomain = window.location.hostname === 'app.taxproexchange.com';
      setIsApp(isAppDomain);
      setCurrentPath(window.location.pathname);
    }
  }, []);

  // Remove early return to prevent hydration mismatch
  // Always render the same structure on server and client

  // Pages that have their own headers and shouldn't get AppNavigation
  const pagesWithOwnHeaders = [
    '/profile/',
    '/onboarding/',
    '/sign-in',
    '/sign-up',
    '/refer',
    '/feedback',
    '/settings',
    '/messages',
    '/jobs/',
    '/search',
    '/p/',
    '/legal',
    '/privacy',
    '/terms',
    '/admin'
  ];
  
  const shouldShowAppNavigation = isClient && isApp && !pagesWithOwnHeaders.some(path => 
    currentPath.startsWith(path)
  );

  // Always render the same structure to prevent hydration mismatch
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <head>
        {/* Viewport meta for proper mobile behavior */}
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        
        {/* Always render marketing site meta tags by default */}
        <link rel="canonical" href="https://www.taxproexchange.com" />
        {/* JSON-LD Structured Data - always include for SEO */}
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
        
        {/* Google Analytics - default to site analytics */}
        <Analytics measurementId={GA_MEASUREMENT_ID_SITE} />
        
        {/* Preconnect to external domains for performance */}
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className={inter.className}>
        <ClerkProvider signInUrl="/sign-in" signUpUrl="/sign-up">
          {/* App navigation - client only */}
          {shouldShowAppNavigation && <AppNavigation />}
          
          {/* Canonical URL - client only */}
          {isClient && !isApp && <CanonicalUrl />}
          
          {/* Main content */}
          {children}
          
          {/* Mobile navigation - client only */}
          {isClient && isApp && <MobileBottomNav />}
          
          {/* Footer - client only to avoid hydration issues */}
          <Footer />
        </ClerkProvider>
      </body>
    </html>
  );
}
