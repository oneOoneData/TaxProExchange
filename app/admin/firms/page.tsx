'use client';

import Link from 'next/link';
import Logo from '@/components/Logo';
import AdminRouteGuard from '@/components/AdminRouteGuard';
import FirmsGrid from '@/components/admin/FirmsGrid';

export default function AdminFirmsPage() {
  return (
    <AdminRouteGuard>
      <div className="min-h-screen bg-gradient-to-b from-white to-slate-50">
        {/* Header */}
        <header className="sticky top-0 z-30 backdrop-blur bg-white/70 border-b border-slate-200">
          <div className="mx-auto max-w-7xl px-4 py-3 flex items-center justify-between">
            <Logo />
            <nav className="flex items-center gap-6 text-sm text-slate-600">
              <Link href="/" className="hover:text-slate-900">Home</Link>
              <Link href="/admin" className="hover:text-slate-900">Admin</Link>
              <Link href="/admin/verify" className="hover:text-slate-900">Verify</Link>
              <Link href="/admin/profiles" className="hover:text-slate-900">Profiles</Link>
              <Link href="/admin/firms" className="hover:text-slate-900 font-medium">Firms</Link>
            </nav>
          </div>
        </header>

        <div className="mx-auto max-w-7xl px-4 py-8">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-semibold text-slate-900 mb-2">Firms Dashboard</h1>
            <p className="text-slate-600">
              View and enrich firm profiles with live website data. The enrichment crawls public firm websites
              to discover team size, specialties, and more.
            </p>
          </div>

          {/* Firms Grid */}
          <FirmsGrid />
        </div>
      </div>
    </AdminRouteGuard>
  );
}

