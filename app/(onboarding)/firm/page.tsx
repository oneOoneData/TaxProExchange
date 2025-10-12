/**
 * Firm Redirect Page
 * 
 * Redirects users based on authentication status:
 * - Not authenticated → /join (sign up to create a firm)
 * - Authenticated → /team (firm dashboard)
 */

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';

export default function FirmRedirectPage() {
  const router = useRouter();
  const { isLoaded, userId } = useAuth();

  useEffect(() => {
    if (!isLoaded) return;
    
    if (userId) {
      // Authenticated: go to team dashboard
      router.push('/team');
      } else {
      // Not authenticated: go to sign up
      router.push('/join');
    }
  }, [isLoaded, userId, router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-gray-600">Redirecting...</div>
      </div>
  );
}
