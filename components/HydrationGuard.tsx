'use client';

import { useEffect, useState } from 'react';

interface HydrationGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * Prevents hydration mismatches by deferring content until after client mount.
 * Use this to wrap content that differs between server and client render.
 */
export default function HydrationGuard({ children, fallback = null }: HydrationGuardProps) {
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);
  
  return mounted ? <>{children}</> : <>{fallback}</>;
}

