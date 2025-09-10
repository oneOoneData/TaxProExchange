'use client';

import { useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Logo from '@/components/Logo';
import UserMenu from '@/components/UserMenu';
import AdminRouteGuard from '@/components/AdminRouteGuard';

export default function DebugClerkPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

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

  if (!user) {
    router.push('/sign-in');
    return null;
  }

  const debugClerkUsers = async () => {
    try {
      setLoading(true);
      setResult(null);
      
      const response = await fetch('/api/debug/clerk-users');
      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({ error: 'Failed to debug Clerk users: ' + error });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminRouteGuard>
      <div className="min-h-screen bg-gradient-to-b from-white to-slate-50">
      {/* Header */}
      <header className="sticky top-0 z-30 backdrop-blur bg-white/70 border-b border-slate-200">
        <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
          <Logo />
          <nav className="hidden md:flex items-center gap-6 text-sm text-slate-600">
            <a href="/" className="hover:text-slate-900">Home</a>
            <a href="/search" className="hover:text-slate-900">Search</a>
            <a href="/jobs" className="hover:text-slate-900">Jobs</a>
          </nav>
          <UserMenu 
            userName={user.fullName || undefined}
            userEmail={user.primaryEmailAddress?.emailAddress}
          />
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Debug Clerk Users</h1>
            <p className="text-slate-600">Debug Clerk API calls and email lookups</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-8">
            <button
              onClick={debugClerkUsers}
              disabled={loading}
              className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:bg-blue-400 transition-colors"
            >
              {loading ? 'Debugging...' : 'Debug Clerk Users'}
            </button>
          </div>

          {result && (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Debug Results</h3>
              <pre className="bg-slate-50 p-4 rounded-md overflow-auto text-sm max-h-96">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          )}
        </motion.div>
      </div>
    </div>
    </AdminRouteGuard>
  );
}
