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
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    if (!isLoaded || isLoading) return;

    if (!user) {
      // No user, redirect to sign in
      router.push('/sign-in');
      return;
    }

    if (!isAdmin) {
      // User is not admin, redirect to home
      router.push('/');
      return;
    }

    // User is admin, allow access
    setIsChecking(false);
  }, [user, isLoaded, isAdmin, isLoading, router]);

  // Show loading while checking
  if (isChecking || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900 mx-auto"></div>
          <p className="mt-2 text-slate-600">Checking admin access...</p>
        </div>
      </div>
    );
  }

  // If we get here, user is admin
  return <>{children}</>;
}
