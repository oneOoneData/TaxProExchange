'use client';

import { SignedIn, SignedOut, useUser } from '@clerk/nextjs';
import { useMemo } from 'react';
import { motion } from 'framer-motion';
import Logo from '@/components/Logo';

const iframeBase = process.env.NEXT_PUBLIC_TALLY_FEEDBACK_FORM || '';

export default function FeedbackPage() {
  const { user, isLoaded } = useUser();

  // Build Tally URL with hidden fields for name/email
  const src = useMemo(() => {
    if (!iframeBase) return '';
    
    const params = new URLSearchParams({
      // match these keys to your Tally hidden fields (Settings → Hidden fields)
      name: user?.fullName || '',
      email: user?.primaryEmailAddress?.emailAddress || '',
      // cosmetic options:
      hideTitle: '1',
      transparentBackground: '1',
    });
    
    return `${iframeBase}?${params.toString()}`;
  }, [user]);

  if (!isLoaded) {
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
          <nav className="flex items-center gap-6 text-sm text-slate-600">
            <a href="/" className="hover:text-slate-900">Home</a>
            <a href="/search" className="hover:text-slate-900">Search</a>
          </nav>
        </div>
      </header>

      <SignedOut>
        {/* Middleware should already protect, but this is a graceful fallback */}
        <div className="max-w-2xl mx-auto p-6 mt-8">
          <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m0 0v2m0-2h2m-2 0H8m13 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1 className="text-xl font-semibold text-slate-900 mb-2">Authentication Required</h1>
            <p className="text-slate-600">Please sign in to submit feedback.</p>
          </div>
        </div>
      </SignedOut>

      <SignedIn>
        {!iframeBase ? (
          <div className="max-w-2xl mx-auto p-6 mt-8">
            <div className="bg-white rounded-2xl border border-slate-200 p-8">
              <h1 className="text-xl font-semibold mb-2">Feedback form not configured</h1>
              <p className="text-sm text-slate-600 mb-4">
                Set <code className="px-1 py-0.5 rounded bg-slate-100">NEXT_PUBLIC_TALLY_FEEDBACK_FORM</code>{' '}
                to your Tally form URL (e.g., https://tally.so/r/xxxxxx) and redeploy.
              </p>
              <div className="bg-slate-50 rounded-lg p-4">
                <p className="text-sm text-slate-700 font-medium mb-2">Developer Setup:</p>
                <ol className="text-sm text-slate-600 space-y-1 list-decimal list-inside">
                  <li>Create a Tally form at <a href="https://tally.so" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">tally.so</a></li>
                  <li>Add hidden fields named "name" and "email" in your form settings</li>
                  <li>Copy the form URL and set it as the environment variable</li>
                  <li>Redeploy your application</li>
                </ol>
              </div>
            </div>
          </div>
        ) : (
          <div className="w-full">
            <div className="max-w-4xl mx-auto p-4 mt-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center mb-6"
              >
                <h1 className="text-3xl font-semibold text-slate-900 mb-3">Submit an idea or bug</h1>
                <p className="text-slate-600">
                  Tell us what to build next or report an issue. Your account details are automatically attached.
                </p>
              </motion.div>
            </div>
            
            <div className="max-w-4xl mx-auto px-4 pb-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="relative pt-[125%] sm:pt-[90%] md:pt-[70%] lg:pt-[60%]"
              >
                {/* Responsive 16:9-ish container */}
                <iframe
                  title="Tally Feedback Form"
                  src={src}
                  className="absolute inset-0 w-full h-full rounded-xl border border-slate-200 shadow-lg"
                  frameBorder="0"
                  marginHeight={0}
                  marginWidth={0}
                />
              </motion.div>
            </div>
          </div>
        )}
      </SignedIn>
    </div>
  );
}
