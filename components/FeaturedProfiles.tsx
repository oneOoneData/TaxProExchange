'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';

interface Profile {
  id: string;
  slug: string;
  first_name: string;
  last_name: string;
  headline: string;
  credential_type: string;
  states: string[];
  specializations: string[];
  avatar_url?: string | null;
}

export default function FeaturedProfiles() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFeaturedProfiles = async () => {
      try {
        // Fetch verified profiles that are accepting work
        const response = await fetch('/api/search?verified_only=true&accepting_work=true&limit=6');
        if (response.ok) {
          const data = await response.json();
          setProfiles(data.profiles || []);
        }
      } catch (error) {
        console.error('Error fetching featured profiles:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFeaturedProfiles();
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-white rounded-xl border border-slate-200 p-4 animate-pulse">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-slate-200 rounded-lg"></div>
              <div className="flex-1">
                <div className="h-4 bg-slate-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-slate-200 rounded w-1/2"></div>
              </div>
            </div>
            <div className="h-3 bg-slate-200 rounded w-full mb-2"></div>
            <div className="h-3 bg-slate-200 rounded w-2/3"></div>
          </div>
        ))}
      </div>
    );
  }

  if (profiles.length === 0) {
    return null; // Don't show the section if no profiles
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-xl font-semibold text-slate-900 mb-2">Featured Verified Professionals</h3>
        <p className="text-slate-600">Join these trusted tax professionals on our platform</p>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {profiles.slice(0, 6).map((profile, index) => (
          <motion.div
            key={profile.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            className="bg-white rounded-xl border border-slate-200 p-4 hover:shadow-md transition-shadow"
          >
            <Link href={`/p/${profile.slug}`} className="block">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-sm font-semibold text-slate-600">
                  {profile.first_name[0]}{profile.last_name[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-slate-900 truncate">
                    {profile.first_name} {profile.last_name}
                  </h4>
                  <p className="text-sm text-slate-500">{profile.credential_type}</p>
                </div>
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                  Verified
                </span>
              </div>
              
              <p className="text-sm text-slate-600 mb-3 line-clamp-2">
                {profile.headline}
              </p>
              
              <div className="flex flex-wrap gap-1 mb-3">
                {profile.states.slice(0, 2).map((state) => (
                  <span
                    key={state}
                    className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-700"
                  >
                    {state}
                  </span>
                ))}
                {profile.states.length > 2 && (
                  <span className="text-xs text-slate-500">
                    +{profile.states.length - 2} more
                  </span>
                )}
              </div>
              
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>
                  {profile.specializations.slice(0, 1).map(spec => 
                    spec.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
                  ).join(', ')}
                  {profile.specializations.length > 1 && '...'}
                </span>
                <span className="text-emerald-600">Available</span>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
      
      <div className="text-center">
        <Link
          href="/search"
          className="inline-flex items-center px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
        >
          View All Professionals
          <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>
    </div>
  );
}
