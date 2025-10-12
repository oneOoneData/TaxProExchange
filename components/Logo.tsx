'use client';

import Link from 'next/link';
import { useUser } from '@clerk/nextjs';

interface LogoProps {
  className?: string;
  showText?: boolean;
}

export default function Logo({ className = '', showText = true }: LogoProps) {
  const { isLoaded, isSignedIn } = useUser();
  
  // Authenticated users go to dashboard, unauthenticated go to homepage
  const href = isLoaded && isSignedIn ? '/dashboard' : '/';
  
  return (
    <Link 
      href={href} 
      className={`flex items-center gap-2 hover:opacity-80 transition-opacity ${className}`}
    >
      {/* Logo Icon */}
      <div className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-slate-900 text-white font-semibold">
        TX
      </div>
      
      {/* Logo Text */}
      {showText && (
        <span className="font-semibold text-slate-900">TaxProExchange</span>
      )}
    </Link>
  );
}
