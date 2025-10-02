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
            <Link href="/events" className="hover:text-slate-900">Events</Link>
            <Link href="/mentorship" className="hover:text-slate-900">Mentorship</Link>
            <Link href="/dashboard" className="hover:text-slate-900">Dashboard</Link>
            {!user && (
              <Link href="/join" className="hover:text-slate-900">Join</Link>
            )}
          </nav>
          
          <div className="flex items-center gap-4">
            {user ? (
              <>
                {/* Messages Icon */}
                <Link
                  href="/messages"
                  className="relative p-2 text-slate-600 hover:text-slate-900 transition-colors"
                  aria-label="Messages"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  {/* TODO: Add notification badge here */}
                </Link>
                
                <UserMenu 
                  userName={user.fullName || undefined}
                  userEmail={user.primaryEmailAddress?.emailAddress}
                />
              </>
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
