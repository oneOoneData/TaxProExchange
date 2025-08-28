'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
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
  accepting_work: boolean;
  verified: boolean;
  specializations: string[];
  states: string[];
  avatar_url: string | null;
}

interface SearchFilters {
  q: string;
  credential_type: string;
  state: string;
  specialization: string;
  accepting_work: string;
}

export default function SearchPage() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [specializations, setSpecializations] = useState<Array<{slug: string, label: string}>>([]);
  const [filters, setFilters] = useState<SearchFilters>({
    q: '',
    credential_type: '',
    state: '',
    specialization: '',
    accepting_work: ''
  });

  const states = [
    'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
    'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
    'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
    'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
    'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
  ];

  useEffect(() => {
    fetchSpecializations();
    searchProfiles();
  }, [filters]);

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

  const searchProfiles = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });

      const response = await fetch(`/api/search?${params}`);
      const data = await response.json();
      setProfiles(data.profiles);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateFilter = (key: keyof SearchFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      q: '',
      credential_type: '',
      state: '',
      specialization: '',
      accepting_work: ''
    });
  };

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
            <Link href="/search" className="hover:text-slate-900 font-medium">Search</Link>
          </nav>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold text-slate-900 mb-2">Find Tax Professionals</h1>
          <p className="text-slate-600">Search for verified CPAs, EAs, and CTEC preparers by credential, location, and specialization.</p>
        </div>

        <div className="grid lg:grid-cols-4 gap-8">
          {/* Filters Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <div className="bg-white rounded-2xl border border-slate-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-slate-900">Filters</h3>
                  <button
                    onClick={clearFilters}
                    className="text-sm text-slate-500 hover:text-slate-700"
                  >
                    Clear all
                  </button>
                </div>

                {/* Search Input */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-slate-700 mb-2">Search</label>
                  <input
                    type="text"
                    placeholder="Name, firm, or keywords..."
                    value={filters.q}
                    onChange={(e) => updateFilter('q', e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-300"
                  />
                </div>

                {/* Credential Type */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-slate-700 mb-2">Credential</label>
                  <select
                    value={filters.credential_type}
                    onChange={(e) => updateFilter('credential_type', e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-300"
                  >
                    <option value="">All credentials</option>
                    <option value="CPA">CPA</option>
                    <option value="EA">EA</option>
                    <option value="CTEC">CTEC</option>
                  </select>
                </div>

                {/* State */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-slate-700 mb-2">State</label>
                  <select
                    value={filters.state}
                    onChange={(e) => updateFilter('state', e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-300"
                  >
                    <option value="">All states</option>
                    {states.map(state => (
                      <option key={state} value={state}>{state}</option>
                    ))}
                  </select>
                </div>

                {/* Specialization */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-slate-700 mb-2">Specialization</label>
                  <select
                    value={filters.specialization}
                    onChange={(e) => updateFilter('specialization', e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-300"
                  >
                    <option value="">All specializations</option>
                    {specializations.map(spec => (
                      <option key={spec.slug} value={spec.slug}>{spec.label}</option>
                    ))}
                  </select>
                </div>

                {/* Availability */}
                <div className="mb-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={filters.accepting_work === 'true'}
                      onChange={(e) => updateFilter('accepting_work', e.target.checked ? 'true' : '')}
                      className="rounded border-slate-300 text-slate-900 focus:ring-slate-300"
                    />
                    <span className="text-sm font-medium text-slate-700">Accepting work</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Results */}
          <div className="lg:col-span-3">
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900 mx-auto"></div>
                <p className="mt-2 text-slate-600">Searching...</p>
              </div>
            ) : profiles.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-slate-600">No professionals found matching your criteria.</p>
                <button
                  onClick={clearFilters}
                  className="mt-2 text-slate-900 hover:text-slate-700 underline"
                >
                  Try clearing some filters
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {profiles.map((profile, index) => (
                  <motion.div
                    key={profile.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                    className="bg-white rounded-2xl border border-slate-200 p-6 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-slate-900">
                            {profile.first_name} {profile.last_name}
                          </h3>
                          {profile.verified && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                              Verified
                            </span>
                          )}
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                            {profile.credential_type}
                          </span>
                        </div>
                        
                        <p className="text-slate-600 font-medium mb-2">{profile.headline}</p>
                        {profile.firm_name && (
                          <p className="text-slate-500 text-sm mb-2">{profile.firm_name}</p>
                        )}
                        <p className="text-slate-600 text-sm mb-3">{profile.bio}</p>
                        
                        <div className="flex flex-wrap gap-2 mb-3">
                          {safeMap(profile.specializations, spec => {
                            const specLabel = specializations.find(s => s.slug === spec)?.label || spec;
                            return (
                              <span
                                key={spec}
                                className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700"
                              >
                                {specLabel}
                              </span>
                            );
                          })}
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm text-slate-500">
                          <span>States: {profile.states ? profile.states.join(', ') : 'Not specified'}</span>
                          <span className={profile.accepting_work ? 'text-emerald-600' : 'text-slate-400'}>
                            {profile.accepting_work ? 'Accepting work' : 'Not accepting work'}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex flex-col gap-2 ml-4">
                        <Link
                          href={`/p/${profile.slug}`}
                          className="inline-flex items-center justify-center rounded-xl bg-slate-900 text-white px-4 py-2 text-sm font-medium hover:bg-slate-800 transition-colors"
                        >
                          View Profile
                        </Link>
                        {profile.accepting_work && (
                          <button className="inline-flex items-center justify-center rounded-xl border border-slate-300 text-slate-700 px-4 py-2 text-sm font-medium hover:bg-slate-50 transition-colors">
                            Connect
                          </button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
