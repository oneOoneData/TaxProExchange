'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { useAdminStatus } from '@/lib/hooks/useAdminStatus';

interface AdminRouteGuardProps {
  children: React.ReactNode;
}

export default function AdminRouteGuard({ children }: AdminRouteGuardProps) {
  const { user, isLoaded } = useUser();
  const { isAdmin, isLoading } = useAdminStatus();
  const router = useRouter();
  const [authState, setAuthState] = useState<'checking' | 'authorized' | 'redirecting'>('checking');

  useEffect(() => {
    console.log('🔍 AdminRouteGuard: Checking access', { isLoaded, isLoading, user: !!user, isAdmin });
    
    // Wait for both Clerk and admin status to load
    if (!isLoaded || isLoading) {
      setAuthState('checking');
      return;
    }

    if (!user) {
      // No user, redirect to sign in
      console.log('🔍 AdminRouteGuard: No user, redirecting to sign-in');
      setAuthState('redirecting');
      router.push('/sign-in');
      return;
    }

    if (isAdmin) {
      // User is admin, allow access
      console.log('🔍 AdminRouteGuard: Admin verified, showing content');
      setAuthState('authorized');
    } else {
      // User is not admin, redirect to home
      console.log('🔍 AdminRouteGuard: Not admin, redirecting to home');
      setAuthState('redirecting');
      router.push('/');
    }
  }, [user, isLoaded, isAdmin, isLoading, router]);

  // Show loading or prevent render during redirect
  if (authState !== 'authorized') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900 mx-auto"></div>
          <p className="mt-2 text-slate-600">
            {authState === 'redirecting' ? 'Redirecting...' : 'Checking admin access...'}
          </p>
        </div>
      </div>
    );
  }

  // Only render children when fully authorized
  return <>{children}</>;
}
