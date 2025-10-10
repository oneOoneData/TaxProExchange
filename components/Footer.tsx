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
            <span className="text-green-600">🔒</span>
            <span>HTTPS by Vercel</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 rounded-lg border border-slate-200">
            <span className="text-blue-600">🛡️</span>
            <span>RLS on Supabase</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 rounded-lg border border-slate-200">
            <span className="text-purple-600">🔐</span>
            <span>Clerk Auth</span>
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
          </div>
        </div>
      </div>
    </footer>
  );
}
