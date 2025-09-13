'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import Link from 'next/link';
import { JobCard } from '@/components/jobs/JobCard';
import { JobFilters } from '@/components/jobs/JobFilters';
import UserMenu from '@/components/UserMenu';
import Logo from '@/components/Logo';
import MobileNav from '@/components/MobileNav';

interface Job {
  id: string;
  title: string;
  description: string;
  status: string;
  deadline_date: string;
  payout_type: string;
  payout_fixed: number;
  payout_min: number;
  payout_max: number;
  payment_terms: string;
  sla: any;
  credentials_required: string[];
  software_required: string[];
  specialization_keys: string[];
  volume_count: number;
  trial_ok: boolean;
  insurance_required: boolean;
  location_us_only: boolean;
  location_states: string[];
  location_countries: string[];
  remote_ok: boolean;
  created_at: string;
  created_by: string;
  firm: {
    name: string;
    verified: boolean;
    slug: string;
  };
}

interface JobFilters {
  specialization: string;
  state: string;
  payout_type: string;
  min_payout: string;
  deadline: string;
  remote: string;
}

export default function JobsPage() {
  const { user, isSignedIn } = useUser();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [myJobs, setMyJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'my'>('all');
  const [filters, setFilters] = useState<JobFilters>({
    specialization: '',
    state: '',
    payout_type: '',
    min_payout: '',
    deadline: '',
    remote: ''
  });

  useEffect(() => {
    fetchJobs();
    if (isSignedIn && user) {
      fetchMyJobs();
    }
  }, [filters, isSignedIn, user]);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value) {
          params.append(key, value);
        }
      });

      const response = await fetch(`/api/jobs?${params.toString()}`);
      const data = await response.json();
      
      if (response.ok) {
        setJobs(data.jobs || []);
      } else {
        console.error('Failed to fetch jobs:', data.error);
      }
    } catch (error) {
      console.error('Error fetching jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMyJobs = async () => {
    try {
      const response = await fetch('/api/jobs/my');
      const data = await response.json();
      
      if (response.ok) {
        setMyJobs(data.jobs || []);
      } else {
        console.error('Failed to fetch my jobs:', data.error);
      }
    } catch (error) {
      console.error('Error fetching my jobs:', error);
    }
  };

  const handleFilterChange = (newFilters: Partial<JobFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const clearFilters = () => {
    setFilters({
      specialization: '',
      state: '',
      payout_type: '',
      min_payout: '',
      deadline: '',
      remote: ''
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-30 backdrop-blur bg-white/70 border-b border-slate-200">
        <div className="container-mobile py-3 flex items-center justify-between">
          <Logo />
          <nav className="hidden md:flex items-center gap-6 text-sm text-slate-600">
            <a href="/#features" className="hover:text-slate-900">Features</a>
            <a href="/#how" className="hover:text-slate-900">How it works</a>
            <a href="/#faq" className="hover:text-slate-900">FAQ</a>
            <a href="/search" className="hover:text-slate-900">Directory</a>
            <a href="/jobs" className="hover:text-slate-900 font-medium text-slate-900">Jobs</a>
            {!isSignedIn && (
              <a href="/join" className="hover:text-slate-900">Join</a>
            )}
          </nav>
          <div className="flex items-center gap-4">
            {isSignedIn ? (
              <UserMenu 
                userName={user?.fullName || undefined}
                userEmail={user?.primaryEmailAddress?.emailAddress}
              />
            ) : (
              <Link
                href="/join"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-slate-900 hover:bg-slate-800"
              >
                Join Now
              </Link>
            )}
            {/* Mobile Menu Button */}
            <button
              onClick={() => {
                console.log('Mobile menu button clicked');
                setIsMobileNavOpen(true);
              }}
              className="mobile-menu-btn"
              aria-label="Open menu"
            >
              <svg className="w-6 h-6 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      <div className="container-mobile py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Tax Professional Jobs
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Find verified tax preparation opportunities from trusted firms. 
            Browse jobs by specialization, location, and compensation.
          </p>
        </div>

        {/* Tabs */}
        {isSignedIn && (
          <div className="flex gap-1 bg-slate-100 rounded-lg p-1 mb-6">
            {[
              { key: 'all', label: 'All Jobs', count: jobs.length },
              { key: 'my', label: 'My Jobs', count: myJobs.length }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === tab.key
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab.label}
                <span className="ml-2 text-xs bg-slate-200 text-slate-600 px-2 py-1 rounded-full">
                  {tab.count}
                </span>
              </button>
            ))}
          </div>
        )}

        {/* Action Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
          <div className="text-sm text-gray-600">
            {loading ? 'Loading...' : `${activeTab === 'my' ? myJobs.length : jobs.length} ${activeTab === 'my' ? 'my' : 'open'} jobs found`}
          </div>
          
          {isSignedIn && (
            <Link
              href="/jobs/new"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Post a Job
            </Link>
          )}
        </div>

        {/* Filters and Jobs */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Filters Sidebar */}
          <div className="lg:col-span-1 order-2 lg:order-1">
            <JobFilters
              filters={filters}
              onFilterChange={handleFilterChange}
              onClearFilters={clearFilters}
            />
          </div>

          {/* Jobs List */}
          <div className="lg:col-span-3 order-1 lg:order-2">
            {loading ? (
              <div className="space-y-4">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="bg-white rounded-lg shadow p-6 animate-pulse">
                    <div className="h-6 bg-gray-200 rounded mb-4"></div>
                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  </div>
                ))}
              </div>
            ) : (() => {
              const currentJobs = activeTab === 'my' ? myJobs : jobs;
              const isEmpty = currentJobs.length === 0;
              
              if (isEmpty) {
                return (
                  <div className="text-center py-12">
                    <div className="text-gray-400 mb-4">
                      <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H8a2 2 0 01-2-2V8a2 2 0 012-2V6" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      {activeTab === 'my' ? 'No jobs posted yet' : 'No jobs found'}
                    </h3>
                    <p className="text-gray-500">
                      {activeTab === 'my' 
                        ? 'You haven\'t posted any jobs yet. Create your first job posting to get started.'
                        : 'Try adjusting your filters or check back later for new opportunities.'
                      }
                    </p>
                    {activeTab === 'my' && (
                      <Link
                        href="/jobs/new"
                        className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                      >
                        Post Your First Job
                      </Link>
                    )}
                  </div>
                );
              }
              
              return (
                <div className="space-y-4">
                  {currentJobs.map((job) => (
                    <JobCard 
                      key={job.id} 
                      job={job} 
                      isOwner={user?.id === job.created_by}
                    />
                  ))}
                </div>
              );
            })()}
          </div>
        </div>

        {/* CTA Section */}
        {!isSignedIn && (
          <div className="mt-16 text-center bg-white rounded-lg shadow p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Ready to find your next opportunity?
            </h2>
            <p className="text-gray-600 mb-6">
              Create your verified profile to apply to jobs and get notified about new opportunities.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/sign-up"
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                Get Started
              </Link>
              <Link
                href="/join"
                className="inline-flex items-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                Learn More
              </Link>
            </div>
          </div>
        )}
      </div>
      {/* Mobile Navigation */}
      <MobileNav isOpen={isMobileNavOpen} onClose={() => setIsMobileNavOpen(false)} />
    </div>
  );
}
