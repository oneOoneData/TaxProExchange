'use client';

import { useState, useEffect, useCallback } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { JobForm } from '@/components/jobs/JobForm';
import UserMenu from '@/components/UserMenu';
import Logo from '@/components/Logo';

interface Profile {
  id: string;
  visibility_state: string;
  firm_name: string;
}

export default function NewJobPage() {
  const { user, isSignedIn } = useUser();
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const checkProfile = useCallback(async () => {
    try {
      const response = await fetch(`/api/profile?clerk_id=${user?.id}`);
      const data = await response.json();

      console.log('Profile check response:', { response: response.ok, data, hasId: !!data.id });

      if (response.ok && data.id) {
        if (data.visibility_state !== 'verified') {
          setError('Only verified profiles can post jobs. Please complete verification first.');
        } else if (!data.firm_name) {
          setError('Only firms can post jobs. Please add a firm name to your profile.');
        } else {
          setProfile(data);
        }
      } else {
        console.log('No profile found, setting error');
        setError('Profile not found. Please complete your profile first.');
      }
    } catch (error) {
      console.error('Error checking profile:', error);
      setError('Failed to verify profile. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (!isSignedIn) {
      router.push('/sign-in');
      return;
    }

    checkProfile();
  }, [checkProfile, isSignedIn, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Checking profile...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <div className="text-red-400 mb-4">
              <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-red-800 mb-2">Cannot Post Job</h3>
            <p className="text-red-700 mb-4">{error}</p>
            <div className="space-y-2">
              {error.includes('verification') && (
                <button
                  onClick={() => router.push('/profile/verify')}
                  className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
                >
                  Go to Verification
                </button>
              )}
              {error.includes('firm name') && (
                <button
                  onClick={() => router.push('/profile/edit')}
                  className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
                >
                  Edit Profile
                </button>
              )}
              {error.includes('Profile not found') && (
                <button
                  onClick={() => router.push('/profile/edit')}
                  className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
                >
                  Complete Profile Setup
                </button>
              )}
              <button
                onClick={() => router.push('/jobs')}
                className="w-full inline-flex justify-center items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                Back to Jobs
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-30 backdrop-blur bg-white/70 border-b border-slate-200">
        <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
          <Logo />
          <nav className="hidden md:flex items-center gap-6 text-sm text-slate-600">
            <a href="/" className="hover:text-slate-900">Home</a>
            <a href="/search" className="hover:text-slate-900">Search</a>
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
                href="/sign-in"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-slate-900 hover:bg-slate-800"
              >
                Join Now
              </Link>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Post a New Job</h1>
          <p className="text-gray-600">
            Create a detailed job posting to find qualified tax professionals for your firm.
          </p>
        </div>

        {/* Job Form */}
        <div className="bg-white rounded-lg shadow">
          <JobForm />
        </div>
      </div>

      {/* Footer is handled by the global layout */}
    </div>
  );
}
