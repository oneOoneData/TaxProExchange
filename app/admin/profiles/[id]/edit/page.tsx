'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Logo from '@/components/Logo';
import AdminRouteGuard from '@/components/AdminRouteGuard';

interface Profile {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  credential_type: string;
  headline: string;
  bio: string;
  firm_name: string;
  slug: string;
  visibility_state: string;
  is_listed: boolean;
  is_deleted: boolean;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

export default function AdminProfileEditPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const getParams = async () => {
      const { id } = await params;
      loadProfile(id);
    };
    getParams();
  }, [params]);

  const loadProfile = async (profileId: string) => {
    try {
      const response = await fetch(`/api/admin/profiles/${profileId}`);
      if (response.ok) {
        const data = await response.json();
        setProfile(data.profile);
      } else {
        setError('Profile not found');
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      setError('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const updateProfileStatus = async (field: 'visibility_state' | 'is_listed', value: string | boolean) => {
    if (!profile) return;

    setSaving(true);
    try {
      const { id } = await params;
      const response = await fetch(`/api/admin/profiles/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          [field]: value
        })
      });

      if (response.ok) {
        // Update local state
        setProfile(prev => prev ? { ...prev, [field]: value } : null);
        // Show success message
        alert('Profile updated successfully!');
      } else {
        const errorData = await response.json();
        alert(`Error updating profile: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Error updating profile');
    } finally {
      setSaving(false);
    }
  };

  const getStatusBadge = (visibilityState: string, isListed: boolean, isDeleted: boolean) => {
    if (isDeleted) {
      return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">Deleted</span>;
    } else if (visibilityState === 'verified' && isListed) {
      return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">Verified & Listed</span>;
    } else if (visibilityState === 'pending_verification') {
      return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">Pending</span>;
    } else if (visibilityState === 'rejected') {
      return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">Rejected</span>;
    } else {
      return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700">Hidden</span>;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900 mx-auto"></div>
          <p className="mt-2 text-slate-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-slate-900 mb-2">Error</h2>
          <p className="text-slate-600 mb-4">{error || 'Profile not found'}</p>
          <Link
            href="/admin/profiles"
            className="inline-flex items-center px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            Back to Profiles
          </Link>
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
            <Link href="/admin/verify" className="hover:text-slate-900">Verify</Link>
            <Link href="/admin/profiles" className="hover:text-slate-900">Profiles</Link>
            <Link href="/admin/profiles" className="hover:text-slate-900 font-medium">← Back to Profiles</Link>
          </nav>
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-4 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-semibold text-slate-900 mb-2">Edit Profile: {profile.first_name} {profile.last_name}</h1>
          <p className="text-slate-600">
            Manage profile status and visibility settings
          </p>
        </div>

        {/* Profile Info Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl border border-slate-200 p-6 mb-6"
        >
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Profile Information</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
              <p className="text-sm text-slate-900">{profile.first_name} {profile.last_name}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
              <p className="text-sm text-slate-900">{profile.email}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Credential Type</label>
              <p className="text-sm text-slate-900">{profile.credential_type}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Firm</label>
              <p className="text-sm text-slate-900">{profile.firm_name || 'Not specified'}</p>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Headline</label>
              <p className="text-sm text-slate-900">{profile.headline || 'Not specified'}</p>
            </div>
            {profile.bio && (
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">Bio</label>
                <p className="text-sm text-slate-900">{profile.bio}</p>
              </div>
            )}
          </div>

          <div className="flex items-center gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Current Status</label>
              {getStatusBadge(profile.visibility_state, profile.is_listed, profile.is_deleted)}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Created</label>
              <p className="text-sm text-slate-900">{new Date(profile.created_at).toLocaleDateString()}</p>
            </div>
            {profile.updated_at && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Last Updated</label>
                <p className="text-sm text-slate-900">{new Date(profile.updated_at).toLocaleDateString()}</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Status Management Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl border border-slate-200 p-6 mb-6"
        >
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Status Management</h2>
          
          <div className="space-y-4">
            {/* Visibility State */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Verification Status</label>
              <select
                value={profile.visibility_state}
                onChange={(e) => updateProfileStatus('visibility_state', e.target.value)}
                disabled={saving}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
              >
                <option value="hidden">Hidden</option>
                <option value="pending_verification">Pending Verification</option>
                <option value="verified">Verified</option>
                <option value="rejected">Rejected</option>
              </select>
              <p className="text-xs text-slate-500 mt-1">
                Controls whether the profile is visible and searchable
              </p>
            </div>

            {/* Listed Status */}
            <div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={profile.is_listed}
                  onChange={(e) => updateProfileStatus('is_listed', e.target.checked)}
                  disabled={saving}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 disabled:opacity-50"
                />
                <span className="text-sm font-medium text-slate-700">List in Search Results</span>
              </label>
              <p className="text-xs text-slate-500 mt-1">
                When checked, this profile will appear in search results (if also verified)
              </p>
            </div>
          </div>
        </motion.div>

        {/* Actions Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl border border-slate-200 p-6"
        >
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Quick Actions</h2>
          
          <div className="flex flex-wrap gap-3">
            <Link
              href={`/p/${profile.slug}`}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              View Public Profile
            </Link>
            
            <button
              onClick={() => updateProfileStatus('visibility_state', 'verified')}
              disabled={saving || profile.visibility_state === 'verified'}
              className="inline-flex items-center px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Mark as Verified
            </button>
            
            <button
              onClick={() => updateProfileStatus('is_listed', true)}
              disabled={saving || profile.is_listed}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
              List in Search
            </button>
            
            <button
              onClick={() => updateProfileStatus('is_listed', false)}
              disabled={saving || !profile.is_listed}
              className="inline-flex items-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L5.636 5.636" />
              </svg>
              Hide from Search
            </button>
          </div>
        </motion.div>
      </div>
    </div>
    </AdminRouteGuard>
  );
}
