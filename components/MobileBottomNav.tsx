'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useUser } from '@clerk/nextjs';

interface MobileBottomNavProps {
  className?: string;
}

export default function MobileBottomNav({ className = '' }: MobileBottomNavProps) {
  const pathname = usePathname();
  const { user } = useUser();

  const navItems = [
    {
      href: '/search',
      label: 'Search',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      ),
    },
    {
      href: '/jobs',
      label: 'Jobs',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2V8a2 2 0 012-2V6" />
        </svg>
      ),
    },
    {
      href: '/dashboard',
      label: 'Dashboard',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h4a2 2 0 012 2v6H8V5z" />
        </svg>
      ),
    },
  ];

  // Don't show on certain pages
  const hiddenPages = [
    '/sign-in',
    '/sign-up',
    '/onboarding',
    '/legal',
    '/privacy',
    '/terms',
    '/admin',
  ];

  const shouldHide = hiddenPages.some(page => pathname.startsWith(page));

  if (shouldHide || !user) {
    return null;
  }

  return (
    <nav className={`fixed bottom-0 inset-x-0 z-[900] border-t bg-white/90 backdrop-blur safe-area-inset md:hidden ${className}`}>
      <div className="mx-auto max-w-screen-sm px-4 py-2">
        <div className="grid grid-cols-3 gap-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href || 
              (item.href === '/dashboard' && pathname.startsWith('/dashboard')) ||
              (item.href === '/jobs' && pathname.startsWith('/jobs')) ||
              (item.href === '/search' && pathname.startsWith('/search'));
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center justify-center gap-1 h-11 px-2 rounded-lg transition-colors duration-200 ${
                  isActive
                    ? 'text-blue-600 bg-blue-50'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                {item.icon}
                <span className="text-xs font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
