import { useClerk, useUser } from '@clerk/nextjs';
import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useAdminStatus } from '@/lib/hooks/useAdminStatus';
import DeleteProfileDialog from './DeleteProfileDialog';

interface UserMenuProps {
  userName?: string;
  userEmail?: string;
}

export default function UserMenu({ userName, userEmail }: UserMenuProps) {
  const { signOut } = useClerk();
  const { user, isLoaded } = useUser();
  const [isOpen, setIsOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [hasPendingConnections, setHasPendingConnections] = useState(false);
  const [pendingConnectionCount, setPendingConnectionCount] = useState(0);
  const [firms, setFirms] = useState<Array<{ id: string; name: string; slug: string }>>([]);
  const menuRef = useRef<HTMLDivElement>(null);
  const { isAdmin, isLoading: isAdminLoading } = useAdminStatus();
  

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Check for pending connection requests
  useEffect(() => {
    if (!isLoaded || !user) return;

    const checkPendingConnections = async () => {
      try {
        const response = await fetch('/api/connections/pending');
        if (response.ok) {
          const data = await response.json();
          setHasPendingConnections(data.count > 0);
          setPendingConnectionCount(data.count);
        } else {
          setHasPendingConnections(false);
          setPendingConnectionCount(0);
        }
      } catch (error) {
        console.error('Failed to check pending connections:', error);
        setHasPendingConnections(false);
        setPendingConnectionCount(0);
      }
    };

    checkPendingConnections();
    
    // Check every 30 seconds
    const interval = setInterval(checkPendingConnections, 30000);
    return () => clearInterval(interval);
  }, [isLoaded, user]);

  // Check if user belongs to any firms
  useEffect(() => {
    if (!isLoaded || !user) return;

    const checkFirms = async () => {
      try {
        const response = await fetch('/api/firms');
        if (response.ok) {
          const data = await response.json();
          setFirms(data.firms || []);
        } else {
          setFirms([]);
        }
      } catch (error) {
        console.error('Failed to check firms:', error);
        setFirms([]);
      }
    };

    checkFirms();
  }, [isLoaded, user]);

  const toggleMenu = () => setIsOpen(!isOpen);

  const handleSignOut = () => {
    signOut();
    setIsOpen(false);
  };

  const handleDeleteProfile = () => {
    setIsDeleteDialogOpen(true);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={menuRef}>
      {/* User Icon Button */}
      <div className="relative">
        <button
          onClick={toggleMenu}
          className="flex items-center justify-center w-10 h-10 rounded-full bg-slate-900 text-white hover:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2"
          aria-label="User menu"
        >
          {userName ? (
            <span className="text-sm font-medium">
              {userName.split(' ').map(n => n[0]).join('').toUpperCase()}
            </span>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          )}
        </button>
      </div>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-slate-200 py-2 z-50"
          >
            {/* User Info */}
            <div className="px-4 py-3 border-b border-slate-100">
              <p className="text-sm font-medium text-slate-900">
                {userName || 'User'}
              </p>
              {userEmail && (
                <p className="text-xs text-slate-500 mt-1">{userEmail}</p>
              )}
            </div>

            {/* Menu Items */}
            <div className="py-1">
              {/* Personal Hub Section */}
              <Link
                href="/profile/edit"
                onClick={() => setIsOpen(false)}
                className="flex items-center px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <svg className="w-4 h-4 mr-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                My Profile
              </Link>

              {/* Firm Dashboards - Only show if user belongs to firms */}
              {firms.length > 0 && (
                <>
                  <div className="border-t border-slate-100 my-1"></div>
                  {firms.map((firm) => (
                    <Link
                      key={firm.id}
                      href="/team"
                      onClick={() => setIsOpen(false)}
                      className="flex items-center px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 transition-colors font-medium"
                    >
                      <svg className="w-4 h-4 mr-3 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                      {firm.name} Dashboard
                    </Link>
                  ))}
                  <div className="border-t border-slate-100 my-1"></div>
                </>
              )}

              <Link
                href="/jobs"
                onClick={() => setIsOpen(false)}
                className="flex items-center px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <svg className="w-4 h-4 mr-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H8a2 2 0 01-2-2V8a2 2 0 012-2V6" />
                </svg>
                My Jobs
              </Link>

              <Link
                href="/profile/applications"
                onClick={() => setIsOpen(false)}
                className="flex items-center px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <svg className="w-4 h-4 mr-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                My Applications
              </Link>

              <Link
                href="/refer"
                onClick={() => setIsOpen(false)}
                className="flex items-center px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <svg className="w-4 h-4 mr-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                </svg>
                Refer a Pro
              </Link>

              <div className="border-t border-slate-100 my-1"></div>

              <Link
                href="/settings"
                onClick={() => setIsOpen(false)}
                className="flex items-center px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <svg className="w-4 h-4 mr-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Settings
              </Link>

              <Link
                href="/feedback"
                onClick={() => setIsOpen(false)}
                className="flex items-center px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <svg className="w-4 h-4 mr-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                Submit Idea / Report Bug
              </Link>

              <div className="border-t border-slate-100 my-1"></div>

              {/* Admin Section - Only show for admin users */}
              {!isAdminLoading && isAdmin && (
                <>
                  <div className="border-t border-slate-100 my-1"></div>
                  <div className="relative">
                <button
                  onClick={() => setIsAdminOpen(!isAdminOpen)}
                  className="flex items-center justify-between w-full px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center">
                    <svg className="w-4 h-4 mr-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Admin Panel
                  </div>
                  <svg 
                    className={`w-4 h-4 text-slate-400 transition-transform ${isAdminOpen ? 'rotate-180' : ''}`} 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                {/* Admin Submenu */}
                <AnimatePresence>
                  {isAdminOpen && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="pl-8">
                        <Link
                          href="/admin"
                          onClick={() => setIsOpen(false)}
                          className="flex items-center px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 transition-colors"
                        >
                          <svg className="w-4 h-4 mr-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          Dashboard
                        </Link>
                        <Link
                          href="/admin/jobs"
                          onClick={() => setIsOpen(false)}
                          className="flex items-center px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 transition-colors"
                        >
                          <svg className="w-4 h-4 mr-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H8a2 2 0 01-2-2V8a2 2 0 012-2V6" />
                          </svg>
                          Manage Jobs
                        </Link>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
                  </div>
                </>
              )}

              <div className="border-t border-slate-100 my-1"></div>

              <button
                onClick={handleDeleteProfile}
                className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
              >
                <svg className="w-4 h-4 mr-3 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Delete Account
              </button>

              <button
                onClick={handleSignOut}
                className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
              >
                <svg className="w-4 h-4 mr-3 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Sign Out
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Profile Dialog */}
      <DeleteProfileDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        userName={userName}
      />
    </div>
  );
}
