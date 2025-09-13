'use client';

import { useUser } from '@clerk/nextjs';
import { useState } from 'react';
import Link from 'next/link';
import Logo from '@/components/Logo';
import UserMenu from '@/components/UserMenu';
import { JoinButton } from '@/components/JoinButton';
import MobileNav from '@/components/MobileNav';

export default function AppNavigation() {
  const { user } = useUser();
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  return (
    <>
      {/* Navigation Header */}
      <header className="sticky top-0 z-30 backdrop-blur bg-white/70 border-b border-slate-200">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
          <Link href="/">
            <Logo />
          </Link>
          
          <nav className="hidden md:flex items-center gap-6 text-sm text-slate-600">
            <Link href="/search" className="hover:text-slate-900">Directory</Link>
            <Link href="/jobs" className="hover:text-slate-900">Jobs</Link>
            <Link href="/dashboard" className="hover:text-slate-900">Dashboard</Link>
            {!user && (
              <Link href="/join" className="hover:text-slate-900">Join</Link>
            )}
          </nav>
          
          <div className="flex items-center gap-4">
            {user ? (
              <UserMenu 
                userName={user.fullName || undefined}
                userEmail={user.primaryEmailAddress?.emailAddress}
              />
            ) : (
              <JoinButton />
            )}
            
            {/* Mobile Menu Button */}
            <button
              onClick={() => {
                console.log('Mobile menu button clicked');
                setIsMobileNavOpen(true);
              }}
              className="mobile-menu-btn"
              aria-label="Open menu"
            >
              <svg className="w-6 h-6 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Navigation */}
      <MobileNav isOpen={isMobileNavOpen} onClose={() => setIsMobileNavOpen(false)} />
    </>
  );
}
