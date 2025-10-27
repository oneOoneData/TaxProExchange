'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useUser } from '@clerk/nextjs';

interface MobileNavProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function MobileNav({ isOpen, onClose }: MobileNavProps) {
  const { user } = useUser();
  const pathname = usePathname();
  const [isCommunityOpen, setIsCommunityOpen] = useState(false);

  const topNavItems = [
    { href: '/search', label: 'Directory' },
  ];

  const communityItems = [
    { href: '/jobs', label: 'Jobs' },
    { href: '/events', label: 'Events' },
    { href: '/mentorship', label: 'Mentorship' },
  ];

  const bottomNavItems = [
    { href: '/partners', label: '🤝 Partners', icon: true },
    { href: '/ai', label: 'AI' },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/20 z-40 md:hidden"
            onClick={onClose}
          />
          
          {/* Mobile Menu */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'tween', duration: 0.3 }}
            className="fixed right-0 top-0 h-full w-80 max-w-[90vw] bg-white shadow-xl z-50 md:hidden"
          >
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-slate-200">
                <h2 className="text-lg font-semibold text-slate-900">Menu</h2>
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
                  aria-label="Close menu"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Navigation Items */}
              <nav className="flex-1 p-6 overflow-y-auto">
                <ul className="space-y-2">
                  {/* Top Nav Items */}
                  {topNavItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          onClick={onClose}
                          className={`block py-3 px-4 rounded-lg transition-colors text-lg ${
                            isActive 
                              ? 'bg-slate-100 text-slate-900 font-medium' 
                              : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                          }`}
                        >
                          {item.label}
                        </Link>
                      </li>
                    );
                  })}

                  {/* Community Dropdown */}
                  <li>
                    <button
                      onClick={() => setIsCommunityOpen(!isCommunityOpen)}
                      className="w-full flex items-center justify-between py-3 px-4 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors text-lg"
                    >
                      <span className="font-medium">Community</span>
                      <svg
                        className={`w-5 h-5 transition-transform ${isCommunityOpen ? 'rotate-180' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    
                    {/* Community Items */}
                    <AnimatePresence>
                      {isCommunityOpen && (
                        <motion.ul
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="ml-4 mt-2 space-y-1 overflow-hidden"
                        >
                          {communityItems.map((item) => {
                            const isActive = pathname === item.href;
                            return (
                              <li key={item.href}>
                                <Link
                                  href={item.href}
                                  onClick={onClose}
                                  className={`block py-2 px-4 rounded-lg transition-colors ${
                                    isActive 
                                      ? 'bg-slate-100 text-slate-900 font-medium' 
                                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                                  }`}
                                >
                                  {item.label}
                                </Link>
                              </li>
                            );
                          })}
                        </motion.ul>
                      )}
                    </AnimatePresence>
                  </li>

                  {/* Bottom Nav Items */}
                  {bottomNavItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          onClick={onClose}
                          className={`block py-3 px-4 rounded-lg transition-colors text-lg ${
                            isActive 
                              ? 'bg-slate-100 text-slate-900 font-medium' 
                              : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                          }`}
                        >
                          {item.label}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </nav>

              {/* User Section */}
              {user && (
                <div className="p-6 border-t border-slate-200">
                  <div className="text-sm text-slate-500 mb-3">Signed in as</div>
                  <div className="text-slate-900 font-medium">{user.fullName || user.primaryEmailAddress?.emailAddress}</div>
                  <div className="mt-4 space-y-2">
                    <Link
                      href="/profile/edit"
                      onClick={onClose}
                      className="block py-2 px-4 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors text-center"
                    >
                      Edit Profile
                    </Link>
                    <Link
                      href="/settings"
                      onClick={onClose}
                      className="block py-2 px-4 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors text-center"
                    >
                      Settings
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
