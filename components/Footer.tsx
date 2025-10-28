'use client';

import { useUser } from '@clerk/nextjs';
import { useState, useEffect } from 'react';

export default function Footer() {
  const { user, isLoaded } = useUser();
  const [currentYear, setCurrentYear] = useState(2024);

  // Set current year after hydration to avoid SSR mismatch
  useEffect(() => {
    setCurrentYear(new Date().getFullYear());
  }, []);

  // Hide footer if user is not loaded or if there are permission issues
  if (!isLoaded) {
    return null;
  }

  return (
    <footer className="py-10 border-t border-slate-100">
      <div className="mx-auto max-w-6xl px-4">
        {/* Trust Signals */}
        <div className="flex flex-wrap items-center justify-center gap-3 mb-6 text-xs text-slate-500">
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 rounded-lg border border-slate-200">
            <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <span>SSL Secured</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 rounded-lg border border-slate-200">
            <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <span>reCAPTCHA Protected</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 rounded-lg border border-slate-200">
            <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <span>Secure Auth</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 rounded-lg border border-slate-200">
            <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
            </svg>
            <span>RLS Security</span>
          </div>
        </div>

        {/* Main Footer */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-slate-500">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-slate-900 text-white font-semibold">TX</span>
            <span>© {currentYear} TaxProExchange</span>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <a href="/trust" className="hover:text-slate-900">Trust & Verification</a>
            <a href="/transparency" className="hover:text-slate-900">Transparency</a>
            <a href="/legal/privacy" className="hover:text-slate-900">Privacy</a>
            <a href="/legal/terms" className="hover:text-slate-900">Terms</a>
            <a href="/join" className="hover:text-slate-900">Join Now</a>
            <a href="/ai/write-for-us" className="hover:text-slate-900">Write for Us</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
