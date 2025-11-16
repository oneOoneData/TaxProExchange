'use client';

import { Inter } from 'next/font/google';
import Head from 'next/head';
import { ClerkProvider } from '@clerk/nextjs';
import dynamic from 'next/dynamic';
import Script from 'next/script';
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
  // Set up real viewport height for mobile browsers
  useRealVH();

  // Simplified: No domain-based conditional rendering
  // All components render unconditionally to prevent hydration issues

  // Always render the same structure to prevent hydration mismatch
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <Head>
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
        <link rel="preconnect" href="https://www.google.com" />
        <link rel="preconnect" href="https://www.gstatic.com" crossOrigin="anonymous" />
      </Head>
      <body className={inter.className}>
        {/* Google reCAPTCHA v3 */}
        {process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY && (
          <Script
            src={`https://www.google.com/recaptcha/api.js?render=${process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY}`}
            strategy="lazyOnload"
          />
        )}
        
        <ClerkProvider signInUrl="/sign-in" signUpUrl="/sign-up">
          {/* Main content - no conditional wrappers */}
          {children}
          
          {/* Footer - always render */}
          <Footer />
        </ClerkProvider>
      </body>
    </html>
  );
}
