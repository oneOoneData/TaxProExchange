'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Logo from '@/components/Logo';
import AdminRouteGuard from '@/components/AdminRouteGuard';

interface PendingProfile {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  credential_type: string;
  headline: string;
  bio: string;
  firm_name: string;
  slug: string;
  licenses: Array<{
    id: string;
    license_kind: string;
    license_number: string;
    issuing_authority: string;
    state: string;
    expires_on: string;
  }>;
  created_at: string;
}

export default function AdminVerifyPage() {
  const [pendingProfiles, setPendingProfiles] = useState<PendingProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => {
    loadPendingVerifications();
  }, []);

  const loadPendingVerifications = async () => {
    try {
      const response = await fetch('/api/admin/verifications/pending');
      if (response.ok) {
        const data = await response.json();
        setPendingProfiles(data.profiles || []);
      }
    } catch (error) {
      console.error('Error loading pending verifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const approveProfile = async (profileId: string) => {
    setProcessing(profileId);
    try {
      const response = await fetch(`/api/admin/verifications/${profileId}/approve`, {
        method: 'POST'
      });

      if (response.ok) {
        // Remove from pending list
        setPendingProfiles(prev => prev.filter(p => p.id !== profileId));
      } else {
        alert('Error approving profile');
      }
    } catch (error) {
      console.error('Error approving profile:', error);
      alert('Error approving profile');
    } finally {
      setProcessing(null);
    }
  };

  const rejectProfile = async (profileId: string, reason: string) => {
    setProcessing(profileId);
    try {
      const response = await fetch(`/api/admin/verifications/${profileId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason })
      });

      if (response.ok) {
        // Remove from pending list
        setPendingProfiles(prev => prev.filter(p => p.id !== profileId));
      } else {
        alert('Error rejecting profile');
      }
    } catch (error) {
      console.error('Error rejecting profile:', error);
      alert('Error rejecting profile');
    } finally {
      setProcessing(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900 mx-auto"></div>
          <p className="mt-2 text-slate-600">Loading pending verifications...</p>
        </div>
      </div>
    );
  }

  return (
    <AdminRouteGuard>
      <div className="min-h-screen bg-gradient-to-b from-white to-slate-50">
      {/* Header */}
      <header className="sticky top-0 z-30 backdrop-blur bg-white/70 border-b border-slate-200">
        <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
          <Logo />
          <nav className="flex items-center gap-6 text-sm text-slate-600">
            <Link href="/admin" className="hover:text-slate-900">Dashboard</Link>
            <Link href="/admin/verify" className="hover:text-slate-900 font-medium">Verify</Link>
            <Link href="/admin/profiles" className="hover:text-slate-900">Profiles</Link>
          </nav>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-semibold text-slate-900 mb-2">Review Verifications</h1>
          <p className="text-slate-600">
            Review and approve or reject pending profile verifications. 
            {pendingProfiles.length > 0 && ` ${pendingProfiles.length} profiles pending review.`}
          </p>
        </div>

        {/* Pending Verifications */}
        {pendingProfiles.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl border border-slate-200 p-12 text-center"
          >
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-slate-900 mb-2">All Caught Up!</h2>
            <p className="text-slate-600">No pending verifications to review.</p>
          </motion.div>
        ) : (
          <div className="space-y-6">
            {pendingProfiles.map((profile, index) => (
              <motion.div
                key={profile.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-2xl border border-slate-200 p-6"
              >
                {/* Profile Header */}
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">
                      {profile.first_name} {profile.last_name}
                    </h3>
                    <p className="text-slate-600">{profile.email}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                        {profile.credential_type}
                      </span>
                      {profile.firm_name && (
                        <span className="text-sm text-slate-500">{profile.firm_name}</span>
                      )}
                    </div>
                  </div>
                  <span className="text-sm text-slate-500">
                    {new Date(profile.created_at).toLocaleDateString()}
                  </span>
                </div>

                {/* Profile Details */}
                <div className="mb-4">
                  {profile.headline && (
                    <p className="text-slate-700 font-medium mb-2">{profile.headline}</p>
                  )}
                  {profile.bio && (
                    <p className="text-slate-600 text-sm mb-3">{profile.bio}</p>
                  )}
                </div>

                {/* Licenses */}
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-slate-700 mb-2">Submitted Licenses:</h4>
                  <div className="space-y-2">
                    {profile.licenses.map((license, licenseIndex) => (
                      <div key={license.id} className="bg-slate-50 rounded-lg p-3 text-sm">
                        <div className="grid md:grid-cols-2 gap-2">
                          <div>
                            <span className="font-medium">Type:</span> {license.license_kind.replace(/_/g, ' ')}
                          </div>
                          <div>
                            <span className="font-medium">Number:</span> {license.license_number}
                          </div>
                          <div>
                            <span className="font-medium">Authority:</span> {license.issuing_authority}
                          </div>
                          {license.state && (
                            <div>
                              <span className="font-medium">State:</span> {license.state}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4 border-t border-slate-200">
                  <button
                    onClick={() => approveProfile(profile.id)}
                    disabled={processing === profile.id}
                    className="flex-1 inline-flex items-center justify-center rounded-xl bg-emerald-600 text-white px-4 py-2 text-sm font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50"
                  >
                    {processing === profile.id ? 'Processing...' : '✓ Approve'}
                  </button>
                  <button
                    onClick={() => {
                      const reason = prompt('Reason for rejection (optional):');
                      if (reason !== null) {
                        rejectProfile(profile.id, reason);
                      }
                    }}
                    disabled={processing === profile.id}
                    className="flex-1 inline-flex items-center justify-center rounded-xl bg-red-600 text-white px-4 py-2 text-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
                  >
                    {processing === profile.id ? 'Processing...' : '✗ Reject'}
                  </button>
                  <Link
                    href={`/p/${profile.slug}`}
                    className="inline-flex items-center justify-center rounded-xl border border-slate-300 text-slate-700 px-4 py-2 text-sm font-medium hover:bg-slate-50 transition-colors"
                  >
                    View Profile
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
    </AdminRouteGuard>
  );
}
