'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';

interface VerificationRequest {
  id: string;
  profile_id: string;
  status: 'pending' | 'approved' | 'rejected';
  notes: string;
  created_at: string;
  profile: {
    first_name: string;
    last_name: string;
    credential_type: string;
    headline: string;
    email: string;
  };
}

export default function AdminVerifyPage() {
  const [requests, setRequests] = useState<VerificationRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In a real app, this would fetch from an admin API
    // For now, we'll show a placeholder
    setLoading(false);
  }, []);

  const handleDecision = async (requestId: string, decision: 'approved' | 'rejected') => {
    // In a real app, this would call an admin API
    console.log(`Marking request ${requestId} as ${decision}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900 mx-auto"></div>
          <p className="mt-2 text-slate-600">Loading verification requests...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-slate-50">
      {/* Header */}
      <header className="sticky top-0 z-30 backdrop-blur bg-white/70 border-b border-slate-200">
        <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-slate-900 text-white font-semibold">TX</span>
            <span className="font-semibold text-slate-900">TaxProExchange</span>
          </Link>
          <nav className="flex items-center gap-6 text-sm text-slate-600">
            <Link href="/" className="hover:text-slate-900">Home</Link>
            <Link href="/search" className="hover:text-slate-900">Search</Link>
            <Link href="/admin/verify" className="hover:text-slate-900 font-medium">Admin</Link>
          </nav>
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold text-slate-900 mb-2">Verification Requests</h1>
          <p className="text-slate-600">Review and approve/reject profile verification requests from tax professionals.</p>
        </div>

        {/* Placeholder for now - in a real app this would show actual requests */}
        <div className="bg-white rounded-3xl border border-slate-200 p-8 text-center">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          
          <h2 className="text-xl font-semibold text-slate-900 mb-2">Admin Panel Coming Soon</h2>
          <p className="text-slate-600 mb-6">
            This admin panel will allow you to review verification requests, approve profiles, and manage the platform.
          </p>
          
          <div className="space-y-3">
            <Link
              href="/search"
              className="inline-block w-full rounded-xl bg-slate-900 text-white px-6 py-3 text-sm font-medium hover:bg-slate-800 transition-colors"
            >
              Browse Verified Profiles
            </Link>
            <Link
              href="/"
              className="inline-block w-full rounded-xl border border-slate-300 text-slate-700 px-6 py-3 text-sm font-medium hover:bg-slate-50 transition-colors"
            >
              Return to Home
            </Link>
          </div>
        </div>

        {/* Future: List of verification requests */}
        {/* 
        <div className="space-y-4">
          {requests.map((request) => (
            <motion.div
              key={request.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl border border-slate-200 p-6"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-slate-900">
                    {request.profile.first_name} {request.profile.last_name}
                  </h3>
                  <p className="text-slate-600">{request.profile.headline}</p>
                  <p className="text-sm text-slate-500">{request.profile.email}</p>
                  <p className="text-sm text-slate-500 mt-2">{request.notes}</p>
                </div>
                
                <div className="flex gap-2 ml-4">
                  <button
                    onClick={() => handleDecision(request.id, 'approved')}
                    className="rounded-xl bg-emerald-600 text-white px-4 py-2 text-sm font-medium hover:bg-emerald-700 transition-colors"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => handleDecision(request.id, 'rejected')}
                    className="rounded-xl bg-red-600 text-white px-4 py-2 text-sm font-medium hover:bg-red-700 transition-colors"
                  >
                    Reject
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
        */}
      </div>
    </div>
  );
}
