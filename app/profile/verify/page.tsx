'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import UserMenu from '@/components/UserMenu';
import Logo from '@/components/Logo';

interface License {
  license_kind: string;
  license_number: string;
  issuing_authority: string;
  state: string;
  expires_on: string;
}

interface Profile {
  id: string;
  first_name: string;
  last_name: string;
  credential_type: string;
  visibility_state: string;
  is_listed: boolean;
}

export default function VerifyPage() {
  const router = useRouter();
  const { user } = useUser();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [licenses, setLicenses] = useState<License[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      // Get current user's profile
      const response = await fetch('/api/profile/me');
      if (response.ok) {
        const data = await response.json();
        setProfile(data);
        setLicenses(data.licenses || []);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const addLicense = () => {
    setLicenses([...licenses, {
      license_kind: '',
      license_number: '',
      issuing_authority: '',
      state: '',
      expires_on: ''
    }]);
  };

  const updateLicense = (index: number, field: keyof License, value: string) => {
    const updated = [...licenses];
    updated[index] = { ...updated[index], [field]: value };
    setLicenses(updated);
  };

  const removeLicense = (index: number) => {
    setLicenses(licenses.filter((_, i) => i !== index));
  };

  const submitVerification = async () => {
    setSubmitting(true);
    setMessage('');

    try {
      const response = await fetch('/api/verification/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profile_id: profile?.id,
          licenses: licenses.filter(l => l.license_number && l.issuing_authority)
        })
      });

      if (response.ok) {
        setMessage('Verification submitted successfully! An admin will review your credentials.');
        // Update profile status
        if (profile) {
          setProfile({ ...profile, visibility_state: 'pending_verification' });
        }
      } else {
        const error = await response.json();
        setMessage(`Error: ${error.error}`);
      }
    } catch (error) {
      setMessage('Error submitting verification. Please try again.');
    } finally {
      setSubmitting(false);
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

  if (!profile) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-slate-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-slate-900 mb-2">Profile Not Found</h1>
          <p className="text-slate-600 mb-4">Please complete your profile first.</p>
          <Link
            href="/profile/edit"
            className="inline-flex items-center justify-center rounded-xl bg-slate-900 text-white px-6 py-3 text-sm font-medium hover:bg-slate-800 transition-colors"
          >
            Complete Profile
          </Link>
        </div>
      </div>
    );
  }

  const canSubmit = licenses.length > 0 && 
    licenses.every(l => l.license_number && l.issuing_authority);

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-slate-50">
      {/* Header */}
      <header className="sticky top-0 z-30 backdrop-blur bg-white/70 border-b border-slate-200">
        <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
          <Logo />
          <nav className="flex items-center gap-6 text-sm text-slate-600">
            <Link href="/" className="hover:text-slate-900">Home</Link>
            <Link href="/profile/edit" className="hover:text-slate-900">Edit Profile</Link>
            <Link href="/profile/verify" className="hover:text-slate-900 font-medium">Verify</Link>
          </nav>
          <div className="flex items-center gap-4">
            {user && (
              <UserMenu 
                userName={user.fullName || undefined}
                userEmail={user.primaryEmailAddress?.emailAddress}
              />
            )}
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-4 py-8">
        {/* Status Banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`mb-8 p-6 rounded-2xl border ${
            profile.visibility_state === 'verified' 
              ? 'bg-emerald-50 border-emerald-200' 
              : profile.visibility_state === 'pending_verification'
              ? 'bg-yellow-50 border-yellow-200'
              : 'bg-slate-50 border-slate-200'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${
              profile.visibility_state === 'verified' 
                ? 'bg-emerald-500' 
                : profile.visibility_state === 'pending_verification'
                ? 'bg-yellow-500'
                : 'bg-slate-400'
            }`}></div>
            <div>
              <h2 className="font-semibold text-slate-900">
                Verification Status: {profile.visibility_state.replace('_', ' ').toUpperCase()}
              </h2>
              <p className="text-sm text-slate-600">
                {profile.visibility_state === 'verified' 
                  ? 'Your profile is verified and visible to other professionals!'
                  : profile.visibility_state === 'pending_verification'
                  ? 'Your verification is under review. This usually takes 1-2 business days.'
                  : 'Submit your credentials to get verified and appear in search results.'
                }
              </p>
            </div>
          </div>
        </motion.div>

        {/* Verification Form */}
        {profile.visibility_state !== 'verified' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl border border-slate-200 p-8"
          >
            <div className="mb-6">
              <h1 className="text-2xl font-semibold text-slate-900 mb-2">Submit for Verification</h1>
              <p className="text-slate-600">
                To appear in search results, we need to verify your professional credentials. 
                Please provide your license information below.
              </p>
            </div>

            {/* Privacy Notice */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-medium text-blue-900 mb-1">Privacy & Verification</h3>
                  <p className="text-sm text-blue-800">
                    <strong>This information is not made public.</strong> We only use it to verify your credentials against official registries. 
                    Your public profile will show verification badges and credential types only.
                  </p>
                </div>
              </div>
            </div>

            {/* Licenses */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-slate-900">Professional Licenses</h3>
                <button
                  onClick={addLicense}
                  className="inline-flex items-center justify-center rounded-xl bg-slate-900 text-white px-4 py-2 text-sm font-medium hover:bg-slate-800 transition-colors"
                >
                  + Add License
                </button>
              </div>

              {licenses.map((license, index) => (
                <div key={index} className="border border-slate-200 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-medium text-slate-900">License {index + 1}</h4>
                    <button
                      onClick={() => removeLicense(index)}
                      className="text-red-600 hover:text-red-700 text-sm"
                    >
                      Remove
                    </button>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">License Type</label>
                      <select
                        value={license.license_kind}
                        onChange={(e) => updateLicense(index, 'license_kind', e.target.value)}
                        className="w-full rounded-xl border border-slate-300 px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-300"
                      >
                        <option value="">Select type</option>
                        <option value="CPA_STATE_LICENSE">CPA State License</option>
                        <option value="EA_ENROLLMENT">EA Enrollment</option>
                        <option value="CTEC_REG">CTEC Registration</option>
                        <option value="OTHER">Other</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">License Number * (Private)</label>
                      <input
                        type="text"
                        value={license.license_number}
                        onChange={(e) => updateLicense(index, 'license_number', e.target.value)}
                        placeholder="Enter your license number"
                        className="w-full rounded-xl border border-slate-300 px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-300"
                      />
                      <p className="text-xs text-slate-500 mt-1">
                        This will never be shown publicly
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Issuing Authority</label>
                      <input
                        type="text"
                        value={license.issuing_authority}
                        onChange={(e) => updateLicense(index, 'issuing_authority', e.target.value)}
                        placeholder="e.g., California Board of Accountancy"
                        className="w-full rounded-xl border border-slate-300 px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-300"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">State (if applicable)</label>
                      <input
                        type="text"
                        value={license.state}
                        onChange={(e) => updateLicense(index, 'state', e.target.value)}
                        placeholder="e.g., CA"
                        className="w-full rounded-xl border border-slate-300 px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-300"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Expiration Date</label>
                      <input
                        type="date"
                        value={license.expires_on}
                        onChange={(e) => updateLicense(index, 'expires_on', e.target.value)}
                        className="w-full rounded-xl border border-slate-300 px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-300"
                      />
                    </div>
                  </div>
                </div>
              ))}

              {licenses.length === 0 && (
                <div className="text-center py-8 border-2 border-dashed border-slate-300 rounded-xl">
                  <p className="text-slate-500 mb-4">No licenses added yet</p>
                  <button
                    onClick={addLicense}
                    className="inline-flex items-center justify-center rounded-xl bg-slate-900 text-white px-6 py-3 text-sm font-medium hover:bg-slate-800 transition-colors"
                  >
                    Add Your First License
                  </button>
                </div>
              )}
            </div>

            {/* Submit Button */}
            <div className="mt-8 pt-6 border-t border-slate-200">
              <button
                onClick={submitVerification}
                disabled={!canSubmit || submitting}
                className={`w-full rounded-xl px-6 py-3 text-sm font-medium transition-colors ${
                  canSubmit && !submitting
                    ? 'bg-slate-900 text-white hover:bg-slate-800'
                    : 'bg-slate-300 text-slate-500 cursor-not-allowed'
                }`}
              >
                {submitting ? 'Submitting...' : 'Submit for Verification'}
              </button>
            </div>

            {/* Message */}
            {message && (
              <div className={`mt-4 p-4 rounded-xl ${
                message.includes('Error') 
                  ? 'bg-red-50 border border-red-200 text-red-800'
                  : 'bg-emerald-50 border border-emerald-200 text-emerald-800'
              }`}>
                {message}
              </div>
            )}
          </motion.div>
        )}

        {/* Already Verified */}
        {profile.visibility_state === 'verified' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl border border-slate-200 p-8 text-center"
          >
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-semibold text-slate-900 mb-2">Profile Verified!</h2>
            <p className="text-slate-600 mb-6">
              Congratulations! Your profile is now verified and visible to other tax professionals.
            </p>
            <Link
              href="/search"
              className="inline-flex items-center justify-center rounded-xl bg-slate-900 text-white px-6 py-3 text-sm font-medium hover:bg-slate-800 transition-colors"
            >
              View Search Results
            </Link>
          </motion.div>
        )}
      </div>
    </div>
  );
}
