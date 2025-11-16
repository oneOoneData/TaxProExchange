'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Logo from '@/components/Logo';
import UserMenu from '@/components/UserMenu';
import AdminRouteGuard from '@/components/AdminRouteGuard';

interface ThinProfile {
  id: string;
  name: string;
  email: string; // This is mapped from public_email in the API
  credential_type: string;
  firm_name: string;
  slug: string;
  headline: string;
  bio: string;
  bio_word_count: number;
  total_word_count: number;
  specializations_count: number;
  states_count: number;
  specializations: string[];
  states: string[];
  created_at: string;
  updated_at: string;
}

export default function ThinProfilesPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [profiles, setProfiles] = useState<ThinProfile[]>([]);
  const [totalProfiles, setTotalProfiles] = useState(0);
  const [selectedProfiles, setSelectedProfiles] = useState<Set<string>>(new Set());
  const [sending, setSending] = useState(false);
  const [emailResult, setEmailResult] = useState<any>(null);

  useEffect(() => {
    fetchThinProfiles();
  }, []);

  const fetchThinProfiles = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/thin-profiles');
      const data = await response.json();
      
      if (data.success) {
        setProfiles(data.thin_profiles);
        setTotalProfiles(data.total_profiles);
      }
    } catch (error) {
      console.error('Error fetching thin profiles:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleProfile = (profileId: string) => {
    const newSelected = new Set(selectedProfiles);
    if (newSelected.has(profileId)) {
      newSelected.delete(profileId);
    } else {
      newSelected.add(profileId);
    }
    setSelectedProfiles(newSelected);
  };

  const selectAll = () => {
    if (selectedProfiles.size === profiles.length) {
      setSelectedProfiles(new Set());
    } else {
      setSelectedProfiles(new Set(profiles.map(p => p.id)));
    }
  };

  const sendEmails = async (profileIds?: string[]) => {
    const targetIds = profileIds || Array.from(selectedProfiles);
    
    if (targetIds.length === 0) {
      alert('Please select at least one profile');
      return;
    }

    const confirmMessage = profileIds 
      ? `Send optimization email to this profile?`
      : `Send optimization emails to ${targetIds.length} selected profiles?`;
    
    if (!confirm(confirmMessage)) {
      return;
    }

    try {
      setSending(true);
      setEmailResult(null);
      
      const response = await fetch('/api/admin/thin-profiles/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ profileIds: targetIds }),
      });

      const data = await response.json();
      setEmailResult(data);
      
      if (data.success) {
        alert(`Successfully sent ${data.sent} emails!`);
        setSelectedProfiles(new Set()); // Clear selection
      }
    } catch (error) {
      console.error('Error sending emails:', error);
      alert('Failed to send emails. Check console for details.');
    } finally {
      setSending(false);
    }
  };

  if (!isLoaded || loading) {
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

  return (
    <AdminRouteGuard>
      <div className="min-h-screen bg-gradient-to-b from-white to-slate-50">
        {/* Header */}
        <header className="sticky top-0 z-30 backdrop-blur bg-white/70 border-b border-slate-200">
          <div className="mx-auto max-w-7xl px-4 py-3 flex items-center justify-between">
            <Logo />
            <nav className="hidden md:flex items-center gap-6 text-sm text-slate-600">
              <Link href="/admin" className="hover:text-slate-900">Admin Home</Link>
              <Link href="/admin/profiles" className="hover:text-slate-900">Profiles</Link>
              <Link href="/admin/thin-profiles" className="font-medium text-slate-900">Thin Profiles</Link>
            </nav>
            <UserMenu 
              userName={user.fullName || undefined}
              userEmail={user.primaryEmailAddress?.emailAddress}
            />
          </div>
        </header>

        <div className="mx-auto max-w-7xl px-4 py-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-slate-900 mb-2">
                Thin Content Profile Management
              </h1>
              <p className="text-slate-600">
                Profiles with &lt;120 total words or missing bios. Help users optimize their profiles for better SEO and visibility.
              </p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <div className="text-sm text-slate-600 mb-1">Total Verified</div>
                <div className="text-3xl font-bold text-slate-900">{totalProfiles}</div>
              </div>
              <div className="bg-white rounded-xl shadow-sm border border-amber-200 p-6">
                <div className="text-sm text-slate-600 mb-1">Thin Profiles</div>
                <div className="text-3xl font-bold text-amber-600">{profiles.length}</div>
                <div className="text-xs text-slate-500 mt-1">
                  {profiles.length > 0 ? `${Math.round((profiles.length / totalProfiles) * 100)}% of total` : '0%'}
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <div className="text-sm text-slate-600 mb-1">Selected</div>
                <div className="text-3xl font-bold text-blue-600">{selectedProfiles.size}</div>
              </div>
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <div className="text-sm text-slate-600 mb-1">Avg Words</div>
                <div className="text-3xl font-bold text-slate-900">
                  {profiles.length > 0 
                    ? Math.round(profiles.reduce((sum, p) => sum + p.total_word_count, 0) / profiles.length)
                    : 0
                  }
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-8">
              <h2 className="text-xl font-semibold text-slate-900 mb-4">Bulk Actions</h2>
              <div className="flex flex-wrap items-center gap-4">
                <button
                  onClick={selectAll}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-md hover:bg-slate-50 transition-colors"
                >
                  {selectedProfiles.size === profiles.length ? 'Deselect All' : 'Select All'}
                </button>
                <button
                  onClick={() => sendEmails()}
                  disabled={sending || selectedProfiles.size === 0}
                  className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors font-medium"
                >
                  {sending ? 'Sending...' : `Send Email to ${selectedProfiles.size} Selected`}
                </button>
                <div className="text-sm text-slate-600">
                  {selectedProfiles.size > 0 && (
                    <span>Rate limit: ~{Math.ceil(selectedProfiles.size / 2)} seconds estimated</span>
                  )}
                </div>
              </div>
            </div>

            {/* Email Results */}
            {emailResult && (
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-8">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Email Results</h3>
                <div className="space-y-2">
                  <p className="text-sm">
                    <strong className="text-green-600">Sent:</strong> {emailResult.sent}
                  </p>
                  <p className="text-sm">
                    <strong className="text-red-600">Failed:</strong> {emailResult.failed}
                  </p>
                  {emailResult.results && emailResult.results.length < 20 && (
                    <details className="mt-4">
                      <summary className="cursor-pointer text-sm text-slate-600 hover:text-slate-900">
                        View Details
                      </summary>
                      <pre className="bg-slate-50 p-4 rounded-md overflow-auto text-xs mt-2">
                        {JSON.stringify(emailResult.results, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              </div>
            )}

            {/* Thin Profiles Table */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-6 border-b border-slate-200">
                <h2 className="text-xl font-semibold text-slate-900">
                  Thin Profiles ({profiles.length})
                </h2>
                <p className="text-sm text-slate-600 mt-1">
                  Profiles below 120 words or with missing bios (&lt;50 words)
                </p>
              </div>

              {profiles.length === 0 ? (
                <div className="p-12 text-center">
                  <div className="text-6xl mb-4">🎉</div>
                  <h3 className="text-xl font-semibold text-slate-900 mb-2">
                    No Thin Profiles!
                  </h3>
                  <p className="text-slate-600">
                    All verified profiles meet the minimum content threshold.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="px-4 py-3 text-left">
                          <input
                            type="checkbox"
                            checked={selectedProfiles.size === profiles.length && profiles.length > 0}
                            onChange={selectAll}
                            className="rounded border-slate-300"
                          />
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase">Name</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase">Credential</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase">Bio Words</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase">Total Words</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase">Specs/States</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase">Updated</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-slate-600 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {profiles.map((profile) => (
                        <tr 
                          key={profile.id}
                          className={`hover:bg-slate-50 transition-colors ${selectedProfiles.has(profile.id) ? 'bg-blue-50' : ''}`}
                        >
                          <td className="px-4 py-4">
                            <input
                              type="checkbox"
                              checked={selectedProfiles.has(profile.id)}
                              onChange={() => toggleProfile(profile.id)}
                              className="rounded border-slate-300"
                            />
                          </td>
                          <td className="px-4 py-4">
                            <div>
                              <Link 
                                href={`/p/${profile.slug}`}
                                target="_blank"
                                className="font-medium text-slate-900 hover:text-blue-600"
                              >
                                {profile.name}
                              </Link>
                              {profile.firm_name && (
                                <div className="text-xs text-slate-500">{profile.firm_name}</div>
                              )}
                              <div className="text-xs text-slate-400">{profile.email}</div>
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <span className="inline-flex items-center px-2 py-1 rounded-md bg-slate-100 text-slate-700 text-xs font-medium">
                              {profile.credential_type}
                            </span>
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-2">
                              <span className={`font-medium ${
                                profile.bio_word_count < 20 ? 'text-red-600' :
                                profile.bio_word_count < 50 ? 'text-amber-600' :
                                'text-slate-900'
                              }`}>
                                {profile.bio_word_count}
                              </span>
                              {profile.bio_word_count === 0 && (
                                <span className="text-xs text-red-600">EMPTY</span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-2">
                              <span className={`font-medium ${
                                profile.total_word_count < 60 ? 'text-red-600' :
                                profile.total_word_count < 120 ? 'text-amber-600' :
                                'text-green-600'
                              }`}>
                                {profile.total_word_count}
                              </span>
                              <div className="text-xs text-slate-500">
                                / 120
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <div className="text-sm text-slate-600">
                              {profile.specializations_count} / {profile.states_count}
                            </div>
                          </td>
                          <td className="px-4 py-4 text-sm text-slate-600">
                            {new Date(profile.updated_at).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Link
                                href={`/admin/profiles/${profile.id}/edit`}
                                className="text-xs text-blue-600 hover:text-blue-800"
                              >
                                Edit
                              </Link>
                              <button
                                onClick={() => sendEmails([profile.id])}
                                disabled={sending}
                                className="text-xs text-green-600 hover:text-green-800 disabled:text-green-400"
                              >
                                Send Email
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Help Section */}
            <div className="mt-8 bg-blue-50 border border-blue-200 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-blue-900 mb-3">
                📧 About the Optimization Email
              </h3>
              <div className="text-sm text-blue-800 space-y-2">
                <p><strong>What it contains:</strong></p>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>Explanation of why complete profiles matter (SEO + visibility)</li>
                  <li>Their current word count and target (150+ words)</li>
                  <li>4 quick wins: bio, specializations, software, photo</li>
                  <li>Credential-specific example bio (CPA, EA, or CTEC)</li>
                  <li>Pro tips for writing compelling bios</li>
                  <li>Direct link to their profile editor</li>
                  <li>Offer: &ldquo;Reply with 3 bullets and I&rsquo;ll write your bio for you&rdquo;</li>
                </ul>
                <p className="mt-4"><strong>Tone:</strong> Helpful and educational, not pushy or sales-y</p>
                <p><strong>Call to action:</strong> Update profile OR reply for personalized help</p>
              </div>
            </div>

            {/* Legend */}
            <div className="mt-6 bg-slate-50 border border-slate-200 rounded-xl p-4">
              <h4 className="text-sm font-semibold text-slate-900 mb-3">Word Count Legend:</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-red-600 font-medium">Red (&lt;60 words)</span>
                  <span className="text-slate-600">- Critical: Needs urgent attention</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-amber-600 font-medium">Amber (60-119 words)</span>
                  <span className="text-slate-600">- Warning: Below threshold</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-green-600 font-medium">Green (120+ words)</span>
                  <span className="text-slate-600">- Good: Meets threshold</span>
                </div>
              </div>
            </div>

          </motion.div>
        </div>
      </div>
    </AdminRouteGuard>
  );
}


