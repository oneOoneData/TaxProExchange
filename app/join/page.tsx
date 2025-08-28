'use client';

import { motion } from 'framer-motion';
import { SignUpButton } from '@clerk/nextjs';
import Link from 'next/link';

// Check if we're in build time (no Clerk environment variables)
const isBuildTime = typeof process !== 'undefined' && !process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

export const dynamic = 'force-dynamic';

export default function JoinPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-slate-50">
      <header className="sticky top-0 z-30 backdrop-blur bg-white/70 border-b border-slate-200">
        <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-slate-900 text-white font-semibold">TX</span>
            <span className="font-semibold text-slate-900">TaxProExchange</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href="/sign-in"
              className="text-sm text-slate-600 hover:text-slate-900 transition-colors"
            >
              Sign In
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-2xl px-4 py-12">
        {/* Simple Auth Step */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl border border-slate-200 p-8 text-center"
        >
          <h1 className="text-3xl font-semibold text-slate-900 mb-4">Join TaxProExchange</h1>
          <p className="text-slate-600 mb-8">
            Connect with other tax professionals. Create your verified profile and start collaborating.
          </p>
          
          <div className="space-y-4">
            {!isBuildTime ? (
              <SignUpButton mode="modal" forceRedirectUrl="/onboarding">
                <button className="w-full flex items-center justify-center gap-3 rounded-xl border border-slate-300 px-6 py-3 text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 12z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Continue with Google
                </button>
              </SignUpButton>
            ) : (
              <button className="w-full flex items-center justify-center gap-3 rounded-xl border border-slate-300 px-6 py-3 text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 12z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continue with Google
              </button>
            )}
          </div>
          
          <p className="mt-6 text-xs text-slate-500">
            By continuing, you agree to our <Link href="/terms" className="text-slate-600 hover:text-slate-800 underline">Terms of Service</Link> and <Link href="/privacy" className="text-slate-600 hover:text-slate-800 underline">Privacy Policy</Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
