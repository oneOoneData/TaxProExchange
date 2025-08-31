'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Logo from '@/components/Logo';

interface Profile {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  credential_type: string;
  headline: string;
  firm_name: string;
  slug: string;
  visibility_state: string;
  is_listed: boolean;
  is_deleted: boolean;
  deleted_at: string | null;
  created_at: string;
}

export default function AdminProfilesPage() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [showDeleted, setShowDeleted] = useState(false);

  useEffect(() => {
    loadProfiles();
  }, [showDeleted]);

  const loadProfiles = async () => {
    try {
      const response = await fetch(`/api/admin/profiles?showDeleted=${showDeleted}`);
      if (response.ok) {
        const data = await response.json();
        setProfiles(data.profiles || []);
      }
    } catch (error) {
      console.error('Error loading profiles:', error);
    } finally {
      setLoading(false);
    }
  };

  const softDeleteProfile = async (profileId: string) => {
    if (!confirm('Are you sure you want to delete this profile? This will hide it from search but preserve the data.')) {
      return;
    }

    setDeleting(profileId);
    try {
      const response = await fetch(`/api/admin/profiles/${profileId}/soft-delete`, {
        method: 'POST'
      });

      if (response.ok) {
        // Refresh the list
        loadProfiles();
      } else {
        alert('Error deleting profile');
      }
    } catch (error) {
      console.error('Error deleting profile:', error);
      alert('Error deleting profile');
    } finally {
      setDeleting(null);
    }
  };

  const restoreProfile = async (profileId: string) => {
    setDeleting(profileId);
    try {
      const response = await fetch(`/api/admin/profiles/${profileId}/restore`, {
        method: 'POST'
      });

      if (response.ok) {
        // Refresh the list
        loadProfiles();
      } else {
        alert('Error restoring profile');
      }
    } catch (error) {
      console.error('Error restoring profile:', error);
      alert('Error restoring profile');
    } finally {
      setDeleting(null);
    }
  };

  const quickUpdateProfile = async (profileId: string, field: 'visibility_state' | 'is_listed', value: string | boolean) => {
    setDeleting(profileId);
    try {
      const response = await fetch(`/api/admin/profiles/${profileId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          [field]: value
        })
      });

      if (response.ok) {
        // Refresh the list
        loadProfiles();
      } else {
        const errorData = await response.json();
        alert(`Error updating profile: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Error updating profile');
    } finally {
      setDeleting(null);
    }
  };

  const requestMoreInfo = async (profileId: string, email: string, name: string) => {
    if (!confirm(`Send a verification request email to ${name} (${email})?`)) {
      return;
    }

    setDeleting(profileId);
    try {
      const response = await fetch('/api/admin/request-verification-info', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          profileId,
          email,
          name
        })
      });

      if (response.ok) {
        alert('Verification request email sent successfully!');
      } else {
        const error = await response.json();
        alert(`Error sending email: ${error.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error sending verification request:', error);
      alert('Error sending verification request email');
    } finally {
      setDeleting(null);
    }
  };

  const sendGeneralEmail = async (profileId: string, email: string, name: string) => {
    const subject = prompt('Email subject:', 'TaxProExchange - Important Information');
    if (!subject) return;
    
    const message = prompt('Email message:', 'Hello,\n\nThis is a message from the TaxProExchange team.\n\nBest regards,\nTaxProExchange Team');
    if (!message) return;

    if (!confirm(`Send email to ${name} (${email})?\n\nSubject: ${subject}\n\nMessage: ${message}`)) {
      return;
    }

    setDeleting(profileId);
    try {
      const response = await fetch('/api/admin/send-general-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          profileId,
          email,
          name,
          subject,
          message
        })
      });

      if (response.ok) {
        alert('Email sent successfully!');
      } else {
        const error = await response.json();
        alert(`Error sending email: ${error.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error sending email:', error);
      alert('Error sending email');
    } finally {
      setDeleting(null);
    }
  };

  const hardDeleteProfile = async (profileId: string) => {
    if (!confirm('⚠️ WARNING: This will PERMANENTLY delete this profile and all associated data. This action cannot be undone. Are you absolutely sure?')) {
      return;
    }

    setDeleting(profileId);
    try {
      const response = await fetch(`/api/admin/profiles/${profileId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        // Remove from list
        setProfiles(prev => prev.filter(p => p.id !== profileId));
      } else {
        alert('Error permanently deleting profile');
      }
    } catch (error) {
      console.error('Error permanently deleting profile:', error);
      alert('Error permanently deleting profile');
    } finally {
      setDeleting(null);
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

  const activeProfiles = profiles.filter(p => !p.is_deleted);
  const deletedProfiles = profiles.filter(p => p.is_deleted);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900 mx-auto"></div>
          <p className="mt-2 text-slate-600">Loading profiles...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-slate-50">
      {/* Header */}
      <header className="sticky top-0 z-30 backdrop-blur bg-white/70 border-b border-slate-200">
        <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
          <Logo />
          <nav className="flex items-center gap-6 text-sm text-slate-600">
            <Link href="/admin" className="hover:text-slate-900">Dashboard</Link>
            <Link href="/admin/verify" className="hover:text-slate-900">Verify</Link>
            <Link href="/admin/profiles" className="hover:text-slate-900 font-medium">Profiles</Link>
          </nav>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-semibold text-slate-900 mb-2">Manage Profiles</h1>
          <p className="text-slate-600">
            View and manage all user profiles on the platform. 
            {activeProfiles.length > 0 && ` ${activeProfiles.length} active profiles.`}
            {deletedProfiles.length > 0 && ` ${deletedProfiles.length} deleted profiles.`}
          </p>
        </div>

        {/* Toggle Deleted Profiles */}
        <div className="mb-6">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={showDeleted}
              onChange={(e) => setShowDeleted(e.target.checked)}
              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-slate-700">Show deleted profiles</span>
          </label>
        </div>

        {/* Profiles Table */}
        {profiles.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl border border-slate-200 p-12 text-center"
          >
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-slate-900 mb-2">No Profiles Found</h2>
            <p className="text-slate-600">No user profiles have been created yet.</p>
          </motion.div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Profile</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Created</th>
                    {showDeleted && (
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Deleted</th>
                    )}
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {profiles.map((profile, index) => (
                    <motion.tr
                      key={profile.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className={`hover:bg-slate-50 ${profile.is_deleted ? 'bg-red-50' : ''}`}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-slate-900">
                            {profile.first_name} {profile.last_name}
                          </div>
                          <div className="text-sm text-slate-500">{profile.email}</div>
                          <div className="text-sm text-slate-500">{profile.credential_type}</div>
                          {profile.headline && (
                            <div className="text-sm text-slate-600 mt-1">{profile.headline}</div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(profile.visibility_state, profile.is_listed, profile.is_deleted)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                        {new Date(profile.created_at).toLocaleDateString()}
                      </td>
                      {showDeleted && profile.deleted_at && (
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                          {new Date(profile.deleted_at).toLocaleDateString()}
                        </td>
                      )}
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex gap-2">
                          <Link
                            href={`/p/${profile.slug}?admin=true`}
                            className="text-blue-600 hover:text-blue-900"
                            onClick={() => console.log('Viewing profile:', profile.id, profile.slug)}
                          >
                            View
                          </Link>
                          <Link
                            href={`/admin/profiles/${profile.id}/edit`}
                            className="text-emerald-600 hover:text-emerald-900"
                          >
                            Edit
                          </Link>
                          
                                                     {/* Quick Status Actions */}
                           {!profile.is_deleted && (
                             <>
                               {/* General Email Button - Show for all profiles */}
                               <button
                                 onClick={() => sendGeneralEmail(profile.id, profile.email, `${profile.first_name} ${profile.last_name}`)}
                                 disabled={deleting === profile.id}
                                 className="text-purple-600 hover:text-purple-900 disabled:opacity-50"
                                 title="Send Email"
                               >
                                   📧 Send Email
                               </button>
                               
                               {/* Request More Info Button - Show for unverified profiles */}
                               {profile.visibility_state !== 'verified' && (
                                 <button
                                   onClick={() => requestMoreInfo(profile.id, profile.email, `${profile.first_name} ${profile.last_name}`)}
                                   disabled={deleting === profile.id}
                                   className="text-blue-600 hover:text-blue-900 disabled:opacity-50"
                                   title="Request More Information"
                                 >
                                   📧 Request Info
                                 </button>
                               )}
                              
                              {profile.visibility_state !== 'verified' && (
                                <button
                                  onClick={() => quickUpdateProfile(profile.id, 'visibility_state', 'verified')}
                                  disabled={deleting === profile.id}
                                  className="text-emerald-600 hover:text-emerald-900 disabled:opacity-50"
                                  title="Mark as Verified"
                                >
                                  ✓ Verify
                                </button>
                              )}
                              
                              {!profile.is_listed && (
                                <button
                                  onClick={() => quickUpdateProfile(profile.id, 'is_listed', true)}
                                  disabled={deleting === profile.id}
                                  className="text-blue-600 hover:text-blue-900 disabled:opacity-50"
                                  title="List in Search"
                                >
                                  📋 List
                                </button>
                              )}
                              
                              {profile.is_listed && (
                                <button
                                  onClick={() => quickUpdateProfile(profile.id, 'is_listed', false)}
                                  disabled={deleting === profile.id}
                                  className="text-orange-600 hover:text-orange-900 disabled:opacity-50"
                                  title="Hide from Search"
                                >
                                  🚫 Hide
                                </button>
                              )}
                            </>
                          )}
                          
                          {!profile.is_deleted ? (
                            <button
                              onClick={() => softDeleteProfile(profile.id)}
                              disabled={deleting === profile.id}
                              className="text-orange-600 hover:text-orange-900 disabled:opacity-50"
                            >
                              {deleting === profile.id ? 'Deleting...' : 'Soft Delete'}
                            </button>
                          ) : (
                            <button
                              onClick={() => restoreProfile(profile.id)}
                              disabled={deleting === profile.id}
                              className="text-emerald-600 hover:text-emerald-900 disabled:opacity-50"
                            >
                              {deleting === profile.id ? 'Restoring...' : 'Restore'}
                            </button>
                          )}
                          
                          <button
                            onClick={() => hardDeleteProfile(profile.id)}
                            disabled={deleting === profile.id}
                            className="text-red-600 hover:text-red-900 disabled:opacity-50"
                          >
                            {deleting === profile.id ? 'Processing...' : 'Hard Delete'}
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
