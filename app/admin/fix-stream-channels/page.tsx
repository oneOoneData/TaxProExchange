'use client';

import { useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import Logo from '@/components/Logo';
import UserMenu from '@/components/UserMenu';
import AdminRouteGuard from '@/components/AdminRouteGuard';

export default function FixStreamChannelsPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const fixStreamChannels = async () => {
    try {
      setLoading(true);
      setResult(null);
      
      const response = await fetch('/api/debug/fix-stream-channels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      const data = await response.json();
      setResult(data);
    } catch (error) {
      console.error('Error fixing Stream channels:', error);
      setResult({ error: 'Failed to fix Stream channels', details: error });
    } finally {
      setLoading(false);
    }
  };

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
    <AdminRouteGuard>
      <div className="min-h-screen bg-gradient-to-b from-white to-slate-50">
        <header className="sticky top-0 z-30 backdrop-blur bg-white/70 border-b border-slate-200">
          <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
            <Logo />
            <UserMenu 
              userName={user?.fullName || undefined}
              userEmail={user?.primaryEmailAddress?.emailAddress}
            />
          </div>
        </header>

        <div className="mx-auto max-w-4xl px-4 py-8">
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h1 className="text-2xl font-bold text-slate-900 mb-6">Fix Stream Channels</h1>
            
            <div className="mb-6">
              <p className="text-slate-600 mb-4">
                This tool will find all accepted connections that don't have Stream channels and create them.
              </p>
              
              <button
                onClick={fixStreamChannels}
                disabled={loading}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Fixing Stream Channels...' : 'Fix Stream Channels'}
              </button>
            </div>

            {result && (
              <div className="mt-6 p-4 bg-slate-50 rounded-lg">
                <h3 className="font-semibold text-slate-900 mb-2">Result:</h3>
                <pre className="text-sm text-slate-700 whitespace-pre-wrap overflow-auto">
                  {JSON.stringify(result, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminRouteGuard>
  );
}
