'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Logo from '@/components/Logo';
import AdminRouteGuard from '@/components/AdminRouteGuard';

interface License {
  id: string;
  license_kind: string;
  license_number: string;
  issuing_authority: string;
  state: string | null;
  expires_on: string | null;
  status: string;
}

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
  ptin: string | null;
  website_url: string | null;
  linkedin_url: string | null;
  phone: string | null;
  licenses: License[];
}

export default function AdminProfilesPage() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [showDeleted, setShowDeleted] = useState(false);
  const [filterUnverified, setFilterUnverified] = useState(true);

  useEffect(() => {
    loadProfiles();
  }, [showDeleted, filterUnverified]);

  const loadProfiles = async () => {
    try {
      const response = await fetch(`/api/admin/profiles?showDeleted=${showDeleted}&filterUnverified=${filterUnverified}`);
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

  const requestProfileUpdate = async (profileId: string, email: string, name: string) => {
    if (!confirm(`Send a profile update request to ${name} (${email})?`)) {
      return;
    }

    setDeleting(profileId);
    try {
      const response = await fetch('/api/admin/request-profile-update', {
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
        alert('Profile update request sent successfully!');
      } else {
        const error = await response.json();
        alert(`Error sending email: ${error.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error sending profile update request:', error);
      alert('Error sending profile update request');
    } finally {
      setDeleting(null);
    }
  };

  const sendProfileUpdateRequest = async (profileId: string) => {
    setDeleting(profileId);
    try {
      const response = await fetch(`/api/admin/profiles/${profileId}/send-update-request`, {
        method: 'POST'
      });

      if (response.ok) {
        alert('Profile update request sent successfully');
        // Refresh the list
        loadProfiles();
      } else {
        alert('Error sending profile update request');
      }
    } catch (error) {
      console.error('Error sending profile update request:', error);
      alert('Error sending profile update request');
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
    <AdminRouteGuard>
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

        {/* Filter Controls */}
        <div className="mb-6 flex flex-wrap gap-4">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={filterUnverified}
              onChange={(e) => setFilterUnverified(e.target.checked)}
              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-slate-700">Show only unverified/unlisted users</span>
          </label>
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
          <>
            {/* Desktop Table - Hidden on Mobile */}
            <div className="hidden md:block bg-white rounded-2xl border border-slate-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Profile & Contact</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">License Info</th>
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
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <div className="text-sm font-medium text-slate-900">
                            {profile.first_name} {profile.last_name}
                          </div>
                          <div className="text-sm text-slate-500">{profile.email}</div>
                          <div className="text-sm text-slate-500">{profile.credential_type}</div>
                          {profile.headline && (
                            <div className="text-sm text-slate-600">{profile.headline}</div>
                          )}
                          {profile.firm_name && (
                            <div className="text-sm text-slate-500">🏢 {profile.firm_name}</div>
                          )}
                          {profile.phone && (
                            <div className="text-sm text-slate-500">📞 {profile.phone}</div>
                          )}
                          {profile.ptin && (
                            <div className="text-sm text-slate-500">🆔 PTIN: {profile.ptin}</div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          {profile.licenses && profile.licenses.length > 0 ? (
                            profile.licenses.map((license) => (
                              <div key={license.id} className="text-sm">
                                <div className="font-medium text-slate-900">
                                  {license.license_kind.replace('_', ' ')}
                                </div>
                                <div className="text-slate-500">
                                  {license.license_number} ({license.state || 'N/A'})
                                </div>
                                <div className="text-slate-500 text-xs">
                                  {license.issuing_authority}
                                  {license.expires_on && ` • Expires: ${new Date(license.expires_on).toLocaleDateString()}`}
                                </div>
                                <div className={`text-xs font-medium ${
                                  license.status === 'verified' ? 'text-green-600' :
                                  license.status === 'rejected' ? 'text-red-600' : 'text-yellow-600'
                                }`}>
                                  {license.status.toUpperCase()}
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="text-sm text-slate-400 italic">No licenses listed</div>
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
                                             <td className="px-6 py-4 text-sm font-medium">
                         <div className="space-y-2">
                           {/* Row 1: View, Edit, Email Actions */}
                           <div className="flex gap-2 flex-wrap">
                             <Link
                               href={`/p/${profile.slug}?admin=true`}
                               className="text-blue-600 hover:text-blue-900 whitespace-nowrap"
                               onClick={() => console.log('Viewing profile:', profile.id, profile.slug)}
                             >
                               View
                             </Link>
                             <Link
                               href={`/admin/profiles/${profile.id}/edit`}
                               className="text-emerald-600 hover:text-emerald-900 whitespace-nowrap"
                             >
                               Edit
                             </Link>
                             
                             {/* Request Profile Update Button - Show for all profiles */}
                             {!profile.is_deleted && (
                               <button
                                 onClick={() => requestProfileUpdate(profile.id, profile.email, `${profile.first_name} ${profile.last_name}`)}
                                 disabled={deleting === profile.id}
                                 className="text-purple-600 hover:text-purple-900 disabled:opacity-50 whitespace-nowrap"
                                 title="Request Profile Update"
                               >
                                 📝 Request Update
                               </button>
                             )}
                             
                             {/* Request More Info Button - Show for unverified profiles */}
                             {!profile.is_deleted && profile.visibility_state !== 'verified' && (
                               <button
                                 onClick={() => requestMoreInfo(profile.id, profile.email, `${profile.first_name} ${profile.last_name}`)}
                                 disabled={deleting === profile.id}
                                 className="text-blue-600 hover:text-blue-900 disabled:opacity-50 whitespace-nowrap"
                                 title="Request More Information"
                               >
                                 📧 Request Info
                               </button>
                             )}
                           </div>
                           
                           {/* Row 2: Status Management */}
                           {!profile.is_deleted && (
                             <div className="flex gap-2 flex-wrap">
                               {profile.visibility_state !== 'verified' && (
                                 <button
                                   onClick={() => quickUpdateProfile(profile.id, 'visibility_state', 'verified')}
                                   disabled={deleting === profile.id}
                                   className="text-emerald-600 hover:text-emerald-900 disabled:opacity-50 whitespace-nowrap"
                                   title="Mark as Verified"
                                 >
                                   ✓ Verify
                                 </button>
                               )}
                               
                               {!profile.is_listed && (
                                 <button
                                   onClick={() => quickUpdateProfile(profile.id, 'is_listed', true)}
                                   disabled={deleting === profile.id}
                                   className="text-blue-600 hover:text-blue-900 disabled:opacity-50 whitespace-nowrap"
                                   title="List in Search"
                                 >
                                   📋 List
                                 </button>
                               )}
                               
                               {profile.is_listed && (
                                 <button
                                   onClick={() => quickUpdateProfile(profile.id, 'is_listed', false)}
                                   disabled={deleting === profile.id}
                                   className="text-orange-600 hover:text-orange-900 disabled:opacity-50 whitespace-nowrap"
                                   title="Hide from Search"
                                 >
                                   🚫 Hide
                                 </button>
                               )}
                               
                               {!profile.is_deleted ? (
                                 <button
                                   onClick={() => softDeleteProfile(profile.id)}
                                   disabled={deleting === profile.id}
                                   className="text-orange-600 hover:text-orange-900 disabled:opacity-50 whitespace-nowrap"
                                 >
                                   {deleting === profile.id ? 'Deleting...' : 'Soft Delete'}
                                 </button>
                               ) : (
                                 <button
                                   onClick={() => restoreProfile(profile.id)}
                                   disabled={deleting === profile.id}
                                   className="text-emerald-600 hover:text-emerald-900 disabled:opacity-50 whitespace-nowrap"
                                 >
                                   {deleting === profile.id ? 'Restoring...' : 'Restore'}
                                 </button>
                               )}
                               
                               <button
                                 onClick={() => hardDeleteProfile(profile.id)}
                                 disabled={deleting === profile.id}
                                 className="text-red-600 hover:text-red-900 disabled:opacity-50 whitespace-nowrap"
                               >
                                 {deleting === profile.id ? 'Processing...' : 'Hard Delete'}
                               </button>
                             </div>
                           )}
                         </div>
                       </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Cards - Hidden on Desktop */}
          <div className="md:hidden space-y-4">
            {profiles.map((profile, index) => (
              <motion.div
                key={profile.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`bg-white rounded-xl border p-4 space-y-3 ${profile.is_deleted ? 'bg-red-50 border-red-200' : 'border-slate-200'}`}
              >
                {/* Profile Header */}
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-base font-semibold text-slate-900">
                      {profile.first_name} {profile.last_name}
                    </h3>
                    <p className="text-sm text-slate-600">{profile.headline}</p>
                    <p className="text-xs text-slate-500">{profile.email}</p>
                    {profile.firm_name && (
                      <p className="text-xs text-slate-500">{profile.firm_name}</p>
                    )}
                  </div>
                  <div className="ml-3">
                    {getStatusBadge(profile.visibility_state, profile.is_listed, profile.is_deleted)}
                  </div>
                </div>

                {/* License Info */}
                {profile.licenses && profile.licenses.length > 0 && (
                  <div className="space-y-1">
                    <h4 className="text-xs font-medium text-slate-700">License Info</h4>
                    <div className="space-y-1">
                      {profile.licenses.slice(0, 2).map((license, idx) => (
                        <div key={idx} className="text-xs text-slate-600">
                          <span className="font-medium">{license.license_kind}:</span> {license.license_number}
                          {license.state && ` (${license.state})`}
                          {license.expires_on && (
                            <span className={`ml-1 ${new Date(license.expires_on) < new Date() ? 'text-red-600' : 'text-slate-500'}`}>
                              Expires {new Date(license.expires_on).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      ))}
                      {profile.licenses.length > 2 && (
                        <div className="text-xs text-slate-500">+{profile.licenses.length - 2} more licenses</div>
                      )}
                    </div>
                  </div>
                )}

                {/* Dates */}
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="font-medium text-slate-700">Created:</span>
                    <div className="text-slate-600">{new Date(profile.created_at).toLocaleDateString()}</div>
                  </div>
                  {showDeleted && profile.is_deleted && profile.deleted_at && (
                    <div>
                      <span className="font-medium text-slate-700">Deleted:</span>
                      <div className="text-slate-600">{new Date(profile.deleted_at).toLocaleDateString()}</div>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-200">
                  <Link
                    href={`/p/${profile.slug || profile.id}`}
                    className="btn-secondary text-xs"
                  >
                    View Profile
                  </Link>
                  
                  {!profile.is_deleted ? (
                    <>
                      <button
                        onClick={() => softDeleteProfile(profile.id)}
                        disabled={deleting === profile.id}
                        className="btn-secondary text-xs text-orange-600 hover:text-orange-700"
                      >
                        {deleting === profile.id ? 'Deleting...' : 'Soft Delete'}
                      </button>
                      
                      {profile.visibility_state === 'pending_verification' && (
                        <button
                          onClick={() => sendProfileUpdateRequest(profile.id)}
                          disabled={deleting === profile.id}
                          className="btn-primary text-xs"
                        >
                          {deleting === profile.id ? 'Sending...' : 'Send Update Request'}
                        </button>
                      )}
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => restoreProfile(profile.id)}
                        disabled={deleting === profile.id}
                        className="btn-primary text-xs"
                      >
                        {deleting === profile.id ? 'Restoring...' : 'Restore'}
                      </button>
                      
                      <button
                        onClick={() => hardDeleteProfile(profile.id)}
                        disabled={deleting === profile.id}
                        className="btn-secondary text-xs text-red-600 hover:text-red-700"
                      >
                        {deleting === profile.id ? 'Processing...' : 'Hard Delete'}
                      </button>
                    </>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </>
        )}
      </div>
    </div>
    </AdminRouteGuard>
  );
}
