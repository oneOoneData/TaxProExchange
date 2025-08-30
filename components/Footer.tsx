'use client';

import { useUser } from '@clerk/nextjs';

export default function Footer() {
  const { user, isLoaded } = useUser();

  // Hide footer if user is not loaded or if there are permission issues
  if (!isLoaded) {
    return null;
  }

  return (
    <footer className="py-10">
      <div className="mx-auto max-w-6xl px-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-slate-500">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-slate-900 text-white font-semibold">TX</span>
            <span>© {new Date().getFullYear()} TaxProExchange</span>
          </div>
          <div className="flex items-center gap-4">
            <a href="/legal/privacy" className="hover:text-slate-900">Privacy</a>
            <a href="/legal/terms" className="hover:text-slate-900">Terms</a>
            <a href="/join" className="hover:text-slate-900">Join Now</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
