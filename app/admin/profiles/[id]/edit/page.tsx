'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Logo from '@/components/Logo';
import AdminRouteGuard from '@/components/AdminRouteGuard';

interface License {
  id?: string;
  license_kind: string;
  license_number: string;
  issuing_authority: string;
  state: string | null;
  expires_on: string | null;
  board_profile_url: string | null;
  status: string;
}

interface MentorshipPreferences {
  id?: string;
  is_open_to_mentor: boolean;
  is_seeking_mentor: boolean;
  topics: string[];
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
  updated_at: string;
  public_email: string | null;
  phone: string | null;
  website_url: string | null;
  linkedin_url: string | null;
  accepting_work: boolean;
  public_contact: boolean;
  works_multistate: boolean;
  works_international: boolean;
  countries: string[];
  specializations: string[];
  states: string[];
  software: string[];
  other_software: string[];
  years_experience: string | null;
  entity_revenue_range: string | null;
  primary_location: any;
  ptin: string | null;
  licenses: License[];
  mentorship_preferences: MentorshipPreferences | null;
}

const US_STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
];

const MENTORSHIP_TOPICS = [
  'Tax Planning Strategies',
  'Client Management',
  'Software Training',
  'Business Development',
  'Regulatory Compliance',
  'Audit Defense',
  'International Tax',
  'Estate Planning',
  'Small Business Tax',
  'Individual Tax Returns',
  'Partnership Tax',
  'Corporate Tax',
  'Nonprofit Tax',
  'Tax Technology',
  'Practice Management'
];

export default function AdminProfileEditPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'basic' | 'licenses' | 'mentorship'>('basic');

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

  const updateProfile = async (field: string, value: any) => {
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

  const updateLicenses = async (licenses: License[]) => {
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
          licenses: licenses
        })
      });

      if (response.ok) {
        // Update local state
        setProfile(prev => prev ? { ...prev, licenses } : null);
        alert('Licenses updated successfully!');
      } else {
        const errorData = await response.json();
        alert(`Error updating licenses: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error updating licenses:', error);
      alert('Error updating licenses');
    } finally {
      setSaving(false);
    }
  };

  const updateMentorship = async (mentorship: MentorshipPreferences) => {
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
          mentorship_preferences: mentorship
        })
      });

      if (response.ok) {
        // Update local state
        setProfile(prev => prev ? { ...prev, mentorship_preferences: mentorship } : null);
        alert('Mentorship preferences updated successfully!');
      } else {
        const errorData = await response.json();
        alert(`Error updating mentorship preferences: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error updating mentorship preferences:', error);
      alert('Error updating mentorship preferences');
    } finally {
      setSaving(false);
    }
  };

  const addLicense = () => {
    if (!profile) return;
    const newLicense: License = {
      license_kind: '',
      license_number: '',
      issuing_authority: '',
      state: null,
      expires_on: null,
      board_profile_url: null,
      status: 'pending'
    };
    updateLicenses([...profile.licenses, newLicense]);
  };

  const updateLicense = (index: number, field: string, value: any) => {
    if (!profile) return;
    const updatedLicenses = [...profile.licenses];
    updatedLicenses[index] = { ...updatedLicenses[index], [field]: value };
    updateLicenses(updatedLicenses);
  };

  const removeLicense = (index: number) => {
    if (!profile) return;
    const updatedLicenses = profile.licenses.filter((_, i) => i !== index);
    updateLicenses(updatedLicenses);
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

        <div className="mx-auto max-w-6xl px-4 py-8">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-semibold text-slate-900 mb-2">Edit Profile: {profile.first_name} {profile.last_name}</h1>
            <p className="text-slate-600">
              Manage profile information, licenses, and mentorship preferences
            </p>
            <div className="mt-4 flex items-center gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Current Status</label>
                {getStatusBadge(profile.visibility_state, profile.is_listed, profile.is_deleted)}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Created</label>
                <p className="text-sm text-slate-900">{new Date(profile.created_at).toLocaleDateString()}</p>
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="mb-6">
            <nav className="flex space-x-8">
              {[
                { id: 'basic', label: 'Basic Info' },
                { id: 'licenses', label: 'Licenses' },
                { id: 'mentorship', label: 'Mentorship' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl border border-slate-200 p-6"
          >
            {activeTab === 'basic' && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold text-slate-900">Basic Information</h2>
                
                {/* Status Management */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Verification Status</label>
                    <select
                      value={profile.visibility_state}
                      onChange={(e) => updateProfile('visibility_state', e.target.value)}
                      disabled={saving}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
                    >
                      <option value="hidden">Hidden</option>
                      <option value="pending_verification">Pending Verification</option>
                      <option value="verified">Verified</option>
                      <option value="rejected">Rejected</option>
                    </select>
                  </div>
                  <div>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={profile.is_listed}
                        onChange={(e) => updateProfile('is_listed', e.target.checked)}
                        disabled={saving}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 disabled:opacity-50"
                      />
                      <span className="text-sm font-medium text-slate-700">List in Search Results</span>
                    </label>
                  </div>
                </div>

                {/* Basic Profile Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">First Name</label>
                    <input
                      type="text"
                      value={profile.first_name}
                      onChange={(e) => updateProfile('first_name', e.target.value)}
                      disabled={saving}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Last Name</label>
                    <input
                      type="text"
                      value={profile.last_name}
                      onChange={(e) => updateProfile('last_name', e.target.value)}
                      disabled={saving}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Email (from Clerk)</label>
                    <p className="text-sm text-slate-600 bg-slate-50 px-3 py-2 rounded-lg">{profile.email}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Public Email</label>
                    <input
                      type="email"
                      value={profile.public_email || ''}
                      onChange={(e) => updateProfile('public_email', e.target.value)}
                      disabled={saving}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
                    <input
                      type="tel"
                      value={profile.phone || ''}
                      onChange={(e) => updateProfile('phone', e.target.value)}
                      disabled={saving}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Credential Type</label>
                    <select
                      value={profile.credential_type}
                      onChange={(e) => updateProfile('credential_type', e.target.value)}
                      disabled={saving}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
                    >
                      <option value="CPA">CPA</option>
                      <option value="EA">EA</option>
                      <option value="CTEC">CTEC</option>
                      <option value="OR_Tax_Preparer">OR Tax Preparer</option>
                      <option value="OR_Tax_Consultant">OR Tax Consultant</option>
                      <option value="Tax Lawyer (JD)">Tax Lawyer (JD)</option>
                      <option value="Accountant">Accountant</option>
                      <option value="Financial Planner">Financial Planner</option>
                      <option value="PTIN Only">PTIN Only</option>
                      <option value="Student">Student</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Firm Name</label>
                    <input
                      type="text"
                      value={profile.firm_name || ''}
                      onChange={(e) => updateProfile('firm_name', e.target.value)}
                      disabled={saving}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">PTIN</label>
                    <input
                      type="text"
                      value={profile.ptin || ''}
                      onChange={(e) => updateProfile('ptin', e.target.value)}
                      disabled={saving}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Headline</label>
                  <input
                    type="text"
                    value={profile.headline || ''}
                    onChange={(e) => updateProfile('headline', e.target.value)}
                    disabled={saving}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Bio</label>
                  <textarea
                    value={profile.bio || ''}
                    onChange={(e) => updateProfile('bio', e.target.value)}
                    disabled={saving}
                    rows={4}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Website URL</label>
                    <input
                      type="url"
                      value={profile.website_url || ''}
                      onChange={(e) => updateProfile('website_url', e.target.value)}
                      disabled={saving}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">LinkedIn URL</label>
                    <input
                      type="url"
                      value={profile.linkedin_url || ''}
                      onChange={(e) => updateProfile('linkedin_url', e.target.value)}
                      disabled={saving}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
                    />
                  </div>
                </div>

                {/* Work Preferences */}
                <div className="space-y-4">
                  <h3 className="text-md font-medium text-slate-900">Work Preferences</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={profile.accepting_work}
                        onChange={(e) => updateProfile('accepting_work', e.target.checked)}
                        disabled={saving}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 disabled:opacity-50"
                      />
                      <span className="text-sm font-medium text-slate-700">Accepting Work</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={profile.public_contact}
                        onChange={(e) => updateProfile('public_contact', e.target.checked)}
                        disabled={saving}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 disabled:opacity-50"
                      />
                      <span className="text-sm font-medium text-slate-700">Public Contact</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={profile.works_multistate}
                        onChange={(e) => updateProfile('works_multistate', e.target.checked)}
                        disabled={saving}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 disabled:opacity-50"
                      />
                      <span className="text-sm font-medium text-slate-700">Works Multistate</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={profile.works_international}
                        onChange={(e) => updateProfile('works_international', e.target.checked)}
                        disabled={saving}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 disabled:opacity-50"
                      />
                      <span className="text-sm font-medium text-slate-700">Works International</span>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'licenses' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-slate-900">Licenses</h2>
                  <button
                    onClick={addLicense}
                    disabled={saving}
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Add License
                  </button>
                </div>

                {profile.licenses.length === 0 ? (
                  <div className="text-center py-8 text-slate-500">
                    <p>No licenses added yet.</p>
                    <p className="text-sm mt-1">Click "Add License" to get started.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {profile.licenses.map((license, index) => (
                      <div key={index} className="border border-slate-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-md font-medium text-slate-900">License {index + 1}</h3>
                          <button
                            onClick={() => removeLicense(index)}
                            disabled={saving}
                            className="text-red-600 hover:text-red-800 disabled:opacity-50"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">License Type</label>
                            <select
                              value={license.license_kind}
                              onChange={(e) => updateLicense(index, 'license_kind', e.target.value)}
                              disabled={saving}
                              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
                            >
                              <option value="">Select type</option>
                              <option value="CPA_STATE_LICENSE">CPA State License</option>
                              <option value="EA_ENROLLMENT">EA Enrollment</option>
                              <option value="CTEC_REG">CTEC Registration</option>
                              <option value="OTHER">Other</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">License Number *</label>
                            <input
                              type="text"
                              value={license.license_number}
                              onChange={(e) => updateLicense(index, 'license_number', e.target.value)}
                              disabled={saving}
                              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
                            />
                            <p className="text-xs text-slate-500 mt-1">
                              This will never be shown publicly
                            </p>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Issuing Authority</label>
                            <input
                              type="text"
                              value={license.issuing_authority}
                              onChange={(e) => updateLicense(index, 'issuing_authority', e.target.value)}
                              disabled={saving}
                              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">State</label>
                            <select
                              value={license.state || ''}
                              onChange={(e) => updateLicense(index, 'state', e.target.value || null)}
                              disabled={saving}
                              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
                            >
                              <option value="">Select state</option>
                              {US_STATES.map(state => (
                                <option key={state} value={state}>{state}</option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Expires On</label>
                            <input
                              type="date"
                              value={license.expires_on || ''}
                              onChange={(e) => updateLicense(index, 'expires_on', e.target.value || null)}
                              disabled={saving}
                              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Board Profile URL</label>
                            <input
                              type="url"
                              value={license.board_profile_url || ''}
                              onChange={(e) => updateLicense(index, 'board_profile_url', e.target.value || null)}
                              disabled={saving}
                              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                            <select
                              value={license.status}
                              onChange={(e) => updateLicense(index, 'status', e.target.value)}
                              disabled={saving}
                              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
                            >
                              <option value="pending">Pending</option>
                              <option value="verified">Verified</option>
                              <option value="rejected">Rejected</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'mentorship' && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold text-slate-900">Mentorship Preferences</h2>
                
                {profile.mentorship_preferences ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={profile.mentorship_preferences?.is_open_to_mentor || false}
                          onChange={(e) => updateMentorship({
                            id: profile.mentorship_preferences?.id,
                            is_open_to_mentor: e.target.checked,
                            is_seeking_mentor: profile.mentorship_preferences?.is_seeking_mentor || false,
                            topics: profile.mentorship_preferences?.topics || []
                          })}
                          disabled={saving}
                          className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 disabled:opacity-50"
                        />
                        <span className="text-sm font-medium text-slate-700">Open to Mentoring Others</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={profile.mentorship_preferences?.is_seeking_mentor || false}
                          onChange={(e) => updateMentorship({
                            id: profile.mentorship_preferences?.id,
                            is_seeking_mentor: e.target.checked,
                            is_open_to_mentor: profile.mentorship_preferences?.is_open_to_mentor || false,
                            topics: profile.mentorship_preferences?.topics || []
                          })}
                          disabled={saving}
                          className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 disabled:opacity-50"
                        />
                        <span className="text-sm font-medium text-slate-700">Seeking a Mentor</span>
                      </label>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Mentorship Topics</label>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {MENTORSHIP_TOPICS.map(topic => (
                          <label key={topic} className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={profile.mentorship_preferences?.topics?.includes(topic) || false}
                              onChange={(e) => {
                                const currentTopics = profile.mentorship_preferences?.topics || [];
                                const topics = e.target.checked
                                  ? [...currentTopics, topic]
                                  : currentTopics.filter(t => t !== topic);
                                updateMentorship({
                                  id: profile.mentorship_preferences?.id,
                                  topics,
                                  is_open_to_mentor: profile.mentorship_preferences?.is_open_to_mentor || false,
                                  is_seeking_mentor: profile.mentorship_preferences?.is_seeking_mentor || false
                                });
                              }}
                              disabled={saving}
                              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 disabled:opacity-50"
                            />
                            <span className="text-sm text-slate-700">{topic}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-slate-500">
                    <p>No mentorship preferences set.</p>
                    <button
                      onClick={() => updateMentorship({
                        is_open_to_mentor: false,
                        is_seeking_mentor: false,
                        topics: []
                      })}
                      disabled={saving}
                      className="mt-4 inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                    >
                      Initialize Mentorship Preferences
                    </button>
                  </div>
                )}
              </div>
            )}
          </motion.div>

          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl border border-slate-200 p-6 mt-6"
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
                onClick={() => updateProfile('visibility_state', 'verified')}
                disabled={saving || profile.visibility_state === 'verified'}
                className="inline-flex items-center px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Mark as Verified
              </button>
              
              <button
                onClick={() => updateProfile('is_listed', true)}
                disabled={saving || profile.is_listed}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
                List in Search
              </button>
              
              <button
                onClick={() => updateProfile('is_listed', false)}
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