'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { safeMap, safeLength } from '@/lib/safe';

export const dynamic = 'force-dynamic';

interface Profile {
  id: string;
  slug: string;
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
  verified: boolean;
  specializations: string[];
  states: string[];
  avatar_url: string | null;
}

export default function ProfilePage() {
  const params = useParams();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [specializations, setSpecializations] = useState<Array<{slug: string, label: string}>>([]);

  useEffect(() => {
    if (params.slug) {
      loadProfile(params.slug as string);
      fetchSpecializations();
    }
  }, [params.slug]);

  const fetchSpecializations = async () => {
    try {
      const response = await fetch('/api/specializations');
      if (response.ok) {
        const data = await response.json();
        setSpecializations(data);
      }
    } catch (error) {
      console.error('Error fetching specializations:', error);
    }
  };

  const loadProfile = async (slug: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/profile/${slug}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          setProfile(null);
          return;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const profileData = await response.json();
      setProfile(profileData);
    } catch (error) {
      console.error('Error loading profile:', error);
      setProfile(null);
    } finally {
      setLoading(false);
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
          <p className="text-slate-600 mb-4">The profile you're looking for doesn't exist.</p>
          <Link
            href="/search"
            className="inline-flex items-center justify-center rounded-xl bg-slate-900 text-white px-4 py-2 text-sm font-medium hover:bg-slate-800 transition-colors"
          >
            Search for Professionals
          </Link>
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
          </nav>
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-4 py-8">
        {/* Profile Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl border border-slate-200 p-8 mb-8"
        >
          <div className="flex items-start gap-6">
            {/* Avatar */}
            <div className="flex-shrink-0">
              <div className="w-24 h-24 rounded-2xl bg-slate-100 flex items-center justify-center text-2xl font-semibold text-slate-600">
                {profile.first_name[0]}{profile.last_name[0]}
              </div>
            </div>

            {/* Profile Info */}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <h1 className="text-3xl font-semibold text-slate-900">
                  {profile.first_name} {profile.last_name}
                </h1>
                {profile.verified && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-emerald-100 text-emerald-700">
                    ✓ Verified
                  </span>
                )}
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-slate-100 text-slate-700">
                  {profile.credential_type}
                </span>
              </div>

              <p className="text-xl text-slate-600 font-medium mb-2">{profile.headline}</p>
              
              {profile.firm_name && (
                <p className="text-slate-500 mb-3">{profile.firm_name}</p>
              )}

              <div className="flex items-center gap-4 text-sm text-slate-500 mb-4">
                <span>States: {profile.states.join(', ')}</span>
                <span className={profile.accepting_work ? 'text-emerald-600' : 'text-slate-400'}>
                  {profile.accepting_work ? '✓ Accepting work' : '✗ Not accepting work'}
                </span>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                {profile.accepting_work && (
                  <button className="inline-flex items-center justify-center rounded-xl bg-slate-900 text-white px-6 py-3 text-sm font-medium hover:bg-slate-800 transition-colors">
                    Connect
                  </button>
                )}
                <Link
                  href="/search"
                  className="inline-flex items-center justify-center rounded-xl border border-slate-300 text-slate-700 px-6 py-3 text-sm font-medium hover:bg-slate-50 transition-colors"
                >
                  Find Similar
                </Link>
              </div>
            </div>
          </div>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Bio */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-2xl border border-slate-200 p-6"
            >
              <h2 className="text-xl font-semibold text-slate-900 mb-4">About</h2>
              <p className="text-slate-600 leading-relaxed">{profile.bio}</p>
            </motion.div>

            {/* Specializations */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-2xl border border-slate-200 p-6"
            >
              <h2 className="text-xl font-semibold text-slate-900 mb-4">Specializations</h2>
              <div className="flex flex-wrap gap-2">
                {safeMap(profile.specializations, spec => {
                  const specLabel = specializations.find(s => s.slug === spec)?.label || spec;
                  return (
                    <span
                      key={spec}
                      className="inline-flex items-center px-3 py-2 rounded-xl text-sm font-medium bg-blue-100 text-blue-700"
                    >
                      {specLabel}
                    </span>
                  );
                })}
              </div>
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Contact Information */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-2xl border border-slate-200 p-6"
            >
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Contact</h3>
              <div className="space-y-3">
                {profile.public_email && (
                  <div>
                    <p className="text-sm text-slate-500 mb-1">Email</p>
                    <a
                      href={`mailto:${profile.public_email}`}
                      className="text-slate-900 hover:text-slate-700 break-all"
                    >
                      {profile.public_email}
                    </a>
                  </div>
                )}
                
                {profile.phone && (
                  <div>
                    <p className="text-sm text-slate-500 mb-1">Phone</p>
                    <a
                      href={`tel:${profile.phone}`}
                      className="text-slate-900 hover:text-slate-700"
                    >
                      {profile.phone}
                    </a>
                  </div>
                )}

                {profile.website_url && (
                  <div>
                    <p className="text-sm text-slate-500 mb-1">Website</p>
                    <a
                      href={profile.website_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-slate-900 hover:text-slate-700 break-all"
                    >
                      {profile.website_url.replace(/^https?:\/\//, '')}
                    </a>
                  </div>
                )}

                {profile.linkedin_url && (
                  <div>
                    <p className="text-sm text-slate-500 mb-1">LinkedIn</p>
                    <a
                      href={profile.linkedin_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-slate-900 hover:text-slate-700"
                    >
                      View Profile
                    </a>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Verification Status */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white rounded-2xl border border-slate-200 p-6"
            >
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Verification</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  <span className="text-sm text-slate-600">Credential verified</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  <span className="text-sm text-slate-600">Background checked</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  <span className="text-sm text-slate-600">Professional verified</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
