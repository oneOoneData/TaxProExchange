'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

interface ProfileForm {
  first_name: string;
  last_name: string;
  headline: string;
  bio: string;
  credential_type: string;
  firm_name: string;
  public_email: string;
  phone: string;
  website_url: string;
  linkedin_url: string;
  accepting_work: boolean;
}

const credentialTypes = [
  { value: 'CPA', label: 'CPA (Certified Public Accountant)' },
  { value: 'EA', label: 'EA (Enrolled Agent)' },
  { value: 'CTEC', label: 'CTEC (California Tax Education Council)' },
  { value: 'Other', label: 'Other Tax Professional' }
];

export default function EditProfilePage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [profileForm, setProfileForm] = useState<ProfileForm>({
    first_name: '',
    last_name: '',
    headline: '',
    bio: '',
    credential_type: '',
    firm_name: '',
    public_email: '',
    phone: '',
    website_url: '',
    linkedin_url: '',
    accepting_work: true
  });

  useEffect(() => {
    if (user && isLoaded) {
      loadExistingProfile();
    }
  }, [user, isLoaded]);

  const loadExistingProfile = async () => {
    try {
      const response = await fetch('/api/profile', {
        credentials: 'include',
      });
      
      if (response.ok) {
        const profile = await response.json();
        setProfileForm(profile);
      } else {
        // No profile exists, redirect to join
        router.push('/join');
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      router.push('/join');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(profileForm),
      });

      if (response.ok) {
        alert('Profile updated successfully!');
        router.push('/');
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Profile update error:', error);
      alert('Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const updateForm = (field: keyof ProfileForm, value: any) => {
    setProfileForm(prev => ({ ...prev, [field]: value }));
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

  if (!user) {
    router.push('/');
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-slate-50">
      <header className="sticky top-0 z-30 backdrop-blur bg-white/70 border-b border-slate-200">
        <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-slate-900 text-white font-semibold">TX</span>
            <span className="font-semibold text-slate-900">TaxProExchange</span>
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-600">Edit Profile</span>
            <Link href="/" className="text-sm text-slate-600 hover:text-slate-900">
              Back to Home
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-2xl px-4 py-12">
        <div className="bg-white rounded-3xl border border-slate-200 p-8">
          <h1 className="text-3xl font-semibold text-slate-900 mb-6">Edit Your Profile</h1>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Info */}
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">First Name *</label>
                <input
                  type="text"
                  required
                  value={profileForm.first_name}
                  onChange={(e) => updateForm('first_name', e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-slate-300"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Last Name *</label>
                <input
                  type="text"
                  required
                  value={profileForm.last_name}
                  onChange={(e) => updateForm('last_name', e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-slate-300"
                />
              </div>
            </div>

            {/* Headline */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Professional Headline *</label>
              <input
                type="text"
                required
                value={profileForm.headline}
                onChange={(e) => updateForm('headline', e.target.value)}
                placeholder="e.g., Senior Tax Consultant, S-Corp Specialist"
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-slate-300"
              />
            </div>

            {/* Bio */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Professional Bio *</label>
              <textarea
                required
                value={profileForm.bio}
                onChange={(e) => updateForm('bio', e.target.value)}
                placeholder="Tell us about your experience, expertise, and what you're looking for..."
                rows={4}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-slate-300 resize-none"
              />
            </div>

            {/* Credential Type */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Credential Type *</label>
              <select
                required
                value={profileForm.credential_type}
                onChange={(e) => updateForm('credential_type', e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-slate-300"
              >
                <option value="">Select your credential</option>
                {credentialTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Firm Name */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Firm Name</label>
              <input
                type="text"
                value={profileForm.firm_name}
                onChange={(e) => updateForm('firm_name', e.target.value)}
                placeholder="Your firm or company name"
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-slate-300"
              />
            </div>

            {/* Contact Info */}
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Public Email *</label>
                <input
                  type="email"
                  required
                  value={profileForm.public_email}
                  onChange={(e) => updateForm('public_email', e.target.value)}
                  placeholder="Email for professional inquiries"
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-slate-300"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Phone</label>
                <input
                  type="tel"
                  value={profileForm.phone}
                  onChange={(e) => updateForm('phone', e.target.value)}
                  placeholder="Professional phone number"
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-slate-300"
                />
              </div>
            </div>

            {/* Website & LinkedIn */}
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Website</label>
                <input
                  type="url"
                  value={profileForm.website_url}
                  onChange={(e) => updateForm('website_url', e.target.value)}
                  placeholder="https://yourwebsite.com"
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-slate-300"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">LinkedIn</label>
                <input
                  type="url"
                  value={profileForm.linkedin_url}
                  onChange={(e) => updateForm('linkedin_url', e.target.value)}
                  placeholder="https://linkedin.com/in/yourprofile"
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-slate-300"
                />
              </div>
            </div>

            {/* Accepting Work */}
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="accepting_work"
                checked={profileForm.accepting_work}
                onChange={(e) => updateForm('accepting_work', e.target.checked)}
                className="rounded border-slate-300 text-slate-900 focus:ring-slate-300"
              />
              <label htmlFor="accepting_work" className="text-sm font-medium text-slate-700">
                I am currently accepting new work and collaborations
              </label>
            </div>

            <div className="mt-8 flex justify-end gap-4">
              <Link
                href="/"
                className="rounded-xl border border-slate-300 text-slate-700 px-6 py-3 text-sm font-medium hover:bg-slate-50 transition-colors"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={loading}
                className="rounded-xl bg-slate-900 text-white px-6 py-3 text-sm font-medium shadow hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Updating...' : 'Update Profile'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
