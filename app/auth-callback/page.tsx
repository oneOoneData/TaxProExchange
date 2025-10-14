'use client';

import { useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter, useSearchParams } from 'next/navigation';

export const dynamic = 'force-dynamic';

/**
 * Simple auth callback page that waits for Clerk to fully initialize
 * before redirecting to the target page. This prevents hydration errors
 * caused by redirecting during auth initialization.
 */
export default function AuthCallbackPage() {
  const { isLoaded, isSignedIn } = useUser();
  const router = useRouter();
  const searchParams = useSearchParams();
  const target = searchParams.get('target') || '/dashboard';

  useEffect(() => {
    // Wait until Clerk is fully loaded
    if (!isLoaded) return;

    if (!isSignedIn) {
      // Not signed in, go to sign-in page
      router.replace('/sign-in');
      return;
    }

    // Clerk is ready and user is authenticated - now safe to redirect
    console.log('Auth ready, redirecting to:', target);
    setTimeout(() => {
      router.replace(target);
    }, 100); // Small delay to ensure DOM is stable
  }, [isLoaded, isSignedIn, target, router]);

  // Render minimal, stable HTML while waiting
  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      backgroundColor: '#f9fafb'
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{
          width: '32px',
          height: '32px',
          border: '3px solid #e5e7eb',
          borderTop: '3px solid #3b82f6',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          margin: '0 auto 8px'
        }} />
        <p style={{ color: '#6b7280', fontSize: '14px' }}>Completing sign in...</p>
        <style>
          {`@keyframes spin { to { transform: rotate(360deg); } }`}
        </style>
      </div>
    </div>
  );
}

