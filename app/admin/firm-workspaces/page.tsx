'use client';

import Link from 'next/link';
import Logo from '@/components/Logo';
import AdminRouteGuard from '@/components/AdminRouteGuard';
import FirmWorkspacesGrid from '@/components/admin/FirmWorkspacesGrid';

export default function AdminFirmWorkspacesPage() {
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
              <Link href="/admin/firms" className="hover:text-slate-900">Enrichment</Link>
              <Link href="/admin/firm-workspaces" className="hover:text-slate-900 font-medium">Firm Workspaces</Link>
            </nav>
          </div>
        </header>

        <div className="mx-auto max-w-7xl px-4 py-8">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-semibold text-slate-900 mb-2">Firm Workspaces</h1>
            <p className="text-slate-600">
              Manage actual firm workspace accounts that have signed up. These are firms with team members,
              not individual profiles with firm information.
            </p>
          </div>

          {/* Firm Workspaces Grid */}
          <FirmWorkspacesGrid />
        </div>
      </div>
    </AdminRouteGuard>
  );
}

