'use client';

import { ClerkProvider } from '@clerk/nextjs';
import dynamic from 'next/dynamic';
import Script from 'next/script';
import Analytics from '@/components/Analytics';
import { useEffect } from 'react';

// Disable SSR for ALL components that might cause hydration issues
const Footer = dynamic(() => import('@/components/Footer'), { ssr: false });
// CanonicalUrl removed - Next.js metadata.alternates.canonical handles this server-side
// Client-side canonical injection would cause duplicate canonicals
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
    <ClerkProvider signInUrl="/sign-in" signUpUrl="/sign-up">
      {/* Google Analytics - default to site analytics */}
      <Analytics measurementId={GA_MEASUREMENT_ID_SITE} />
      
      {/* Main content - no conditional wrappers */}
      {children}
      
      {/* Footer - always render */}
      <Footer />
    </ClerkProvider>
  );
}
