'use client';

import { useUser } from '@clerk/nextjs';
import { useState } from 'react';
import Link from 'next/link';
import Logo from '@/components/Logo';
import UserMenu from '@/components/UserMenu';
import AppMobileNav from '@/components/AppMobileNav';
import MobileBottomNav from '@/components/MobileBottomNav';

export const dynamic = 'force-dynamic';

export default function FirmLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoaded } = useUser();
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  // Wait for Clerk to load before rendering to prevent hydration issues
  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Header */}
      <header className="sticky top-0 z-30 backdrop-blur bg-white/70 border-b border-slate-200">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
          <Logo />
          
          <nav className="hidden md:flex items-center gap-6 text-sm text-slate-600">
            <Link href="/team" className="hover:text-slate-900 font-medium text-slate-900">Team</Link>
            <Link href="/team/settings" className="hover:text-slate-900">Settings</Link>
            <Link href="/search" className="hover:text-slate-900">Directory</Link>
            <Link href="/jobs" className="hover:text-slate-900">Jobs</Link>
            <Link href="/events" className="hover:text-slate-900">Events</Link>
            <Link href="/dashboard" className="hover:text-slate-900">My Profile</Link>
          </nav>
          
          <div className="flex items-center gap-4">
            {user ? (
              <>
                {/* Feedback Icon */}
                <Link
                  href="/feedback"
                  className="relative p-2 text-slate-600 hover:text-slate-900 transition-colors"
                  aria-label="Log an improvement or issue"
                  title="Log an improvement or issue"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </Link>

                {/* Messages Icon */}
                <Link
                  href="/messages"
                  className="relative p-2 text-slate-600 hover:text-slate-900 transition-colors"
                  aria-label="Messages"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </Link>
                
                <UserMenu 
                  userName={user.fullName || undefined}
                  userEmail={user.primaryEmailAddress?.emailAddress}
                />
              </>
            ) : (
              <Link
                href="/join"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-slate-900 hover:bg-slate-800"
              >
                Join Now
              </Link>
            )}
            
            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileNavOpen(true)}
              className="md:hidden p-2 text-slate-600 hover:text-slate-900"
              aria-label="Open menu"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="pb-16 md:pb-0">
        {children}
      </div>

      {/* Mobile Navigation */}
      <AppMobileNav isOpen={isMobileNavOpen} onClose={() => setIsMobileNavOpen(false)} />
      
      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />
    </div>
  );
}

