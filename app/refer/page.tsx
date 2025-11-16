'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import Link from 'next/link';
import { motion } from 'framer-motion';
import Logo from '@/components/Logo';
import UserMenu from '@/components/UserMenu';
import { setReferralCookie, getReferralCookie } from '@/lib/cookies';

interface UserProfile {
  id: string;
  first_name: string;
  last_name: string;
  slug: string;
}

export default function ReferPage() {
  const { user, isLoaded } = useUser();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Generate referral URL
  const getReferralUrl = () => {
    const baseUrl = 'https://www.taxproexchange.com/join';
    if (profile?.slug) {
      return `${baseUrl}?ref=${profile.slug}`;
    }
    return baseUrl;
  };

  // Share URLs
  const shareUrls = {
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(getReferralUrl())}`,
    twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent("Join me on TaxProExchange — a verified directory for referrals and overflow work.")}&url=${encodeURIComponent(getReferralUrl())}`,
    email: `mailto:?subject=${encodeURIComponent("Join me on TaxProExchange")}&body=${encodeURIComponent(`Hi — I'm using TaxProExchange to connect with verified CPAs/EAs/CTEC preparers for referrals and overflow work. Join here: ${getReferralUrl()}`)}`
  };

  // Copy link to clipboard
  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(getReferralUrl());
      setToastMessage('Link copied to clipboard!');
      setTimeout(() => setToastMessage(null), 3000);
    } catch (error) {
      console.error('Failed to copy link:', error);
      setToastMessage('Failed to copy link');
      setTimeout(() => setToastMessage(null), 3000);
    }
  };

  // Fetch user profile
  useEffect(() => {
    if (isLoaded && user) {
      fetch('/api/me')
        .then(res => res.json())
        .then(data => {
          setProfile(data.profile);
          setLoading(false);
        })
        .catch(error => {
          console.error('Error fetching profile:', error);
          setLoading(false);
        });
    } else if (isLoaded && !user) {
      setLoading(false);
    }
  }, [isLoaded, user]);

  // Show loading state
  if (!isLoaded || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900 mx-auto"></div>
          <p className="mt-2 text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-slate-50">
      {/* Header */}
      <header className="sticky top-0 z-30 backdrop-blur bg-white/70 border-b border-slate-200">
        <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
          <Logo />
          <nav className="hidden md:flex items-center gap-6 text-sm text-slate-600">
            <Link href="/" className="hover:text-slate-900">Home</Link>
            <Link href="/search" className="hover:text-slate-900">Directory</Link>
            <Link href="/jobs" className="hover:text-slate-900">Jobs</Link>
          </nav>
          <div className="flex items-center gap-4">
            {user ? (
              <UserMenu 
                userName={user.fullName || undefined}
                userEmail={user.primaryEmailAddress?.emailAddress}
              />
            ) : (
              <Link
                href="/sign-in"
                className="text-sm text-slate-600 hover:text-slate-900 transition-colors"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl border border-slate-200 p-8 text-center"
        >
          <h1 className="text-4xl font-semibold text-slate-900 mb-4">Refer a Pro</h1>
          <p className="text-lg text-slate-600 mb-8">
            Invite CPAs, EAs, and CTEC preparers to join TaxProExchange.
          </p>

          {/* Referral Link Display */}
          <div className="bg-slate-50 rounded-xl p-6 mb-8">
            <h3 className="text-lg font-medium text-slate-900 mb-3">Your referral link</h3>
            <div className="flex items-center gap-3 bg-white rounded-lg border border-slate-200 p-3">
              <input
                type="text"
                value={getReferralUrl()}
                readOnly
                className="flex-1 text-sm text-slate-600 bg-transparent border-none outline-none"
              />
              <button
                onClick={copyLink}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
              >
                Copy
              </button>
            </div>
            {profile?.slug && (
              <p className="text-xs text-slate-500 mt-2">
                This link includes your referral code. You&rsquo;ll earn a Referrer badge when your colleague gets verified.
              </p>
            )}
          </div>

          {/* Share Buttons */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <a
              href={shareUrls.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-3 px-6 py-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
              </svg>
              Share on LinkedIn
            </a>

            <a
              href={shareUrls.twitter}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-3 px-6 py-4 bg-black text-white rounded-xl hover:bg-gray-800 transition-colors font-medium"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
              Share on X
            </a>

            <a
              href={shareUrls.email}
              className="flex items-center justify-center gap-3 px-6 py-4 bg-slate-600 text-white rounded-xl hover:bg-slate-700 transition-colors font-medium"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Invite via Email
            </a>
          </div>

          {/* Info Note */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <p className="text-sm text-blue-800">
              <strong>You&rsquo;ll earn a Referrer badge when your colleague gets verified.</strong> 
              {!profile?.slug && ' Sign in to get your personalized referral link.'}
            </p>
          </div>
        </motion.div>
      </div>

      {/* Toast */}
      {toastMessage && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          className="fixed bottom-4 right-4 bg-slate-900 text-white px-6 py-3 rounded-lg shadow-lg z-50"
        >
          {toastMessage}
        </motion.div>
      )}
    </div>
  );
}
