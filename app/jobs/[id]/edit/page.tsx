'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { JobForm } from '@/components/jobs/JobForm';
import UserMenu from '@/components/UserMenu';
import Logo from '@/components/Logo';

export default function EditJobPage() {
  const { user, isSignedIn } = useUser();
  const params = useParams();
  const router = useRouter();
  const [isOwner, setIsOwner] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const jobId = params.id as string;

  useEffect(() => {
    if (!isSignedIn || !user) {
      router.push('/sign-in');
      return;
    }

    const checkOwnership = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/jobs/${jobId}/check-ownership`);
        const data = await response.json();
        
        if (response.ok) {
          setIsOwner(data.isOwner);
          if (!data.isOwner) {
            setError('You do not have permission to edit this job');
          }
        } else {
          setError('Failed to verify job ownership');
        }
      } catch (error) {
        console.error('Error checking ownership:', error);
        setError('Failed to verify job ownership');
      } finally {
        setLoading(false);
      }
    };

    if (jobId) {
      checkOwnership();
    }
  }, [isSignedIn, user, jobId, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (error || !isOwner) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <div className="text-red-400 mb-4">
              <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-red-800 mb-2">Access Denied</h3>
            <p className="text-red-700 mb-4">{error || 'You do not have permission to edit this job.'}</p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => router.push(`/jobs/${jobId}`)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
              >
                Back to Job
              </button>
              <Link
                href="/jobs"
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                Browse Jobs
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
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
                href="/join"
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
          <nav className="flex mb-4" aria-label="Breadcrumb">
            <ol className="inline-flex items-center space-x-1 md:space-x-3">
              <li className="inline-flex items-center">
                <Link href="/jobs" className="text-gray-500 hover:text-gray-700">
                  Jobs
                </Link>
              </li>
              <li>
                <div className="flex items-center">
                  <svg className="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                  <Link href={`/jobs/${jobId}`} className="text-gray-500 hover:text-gray-700 ml-1 md:ml-2">
                    Job Details
                  </Link>
                </div>
              </li>
              <li>
                <div className="flex items-center">
                  <svg className="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-gray-500 ml-1 md:ml-2">Edit</span>
                </div>
              </li>
            </ol>
          </nav>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Edit Job</h1>
          <p className="text-gray-600">
            Update your job posting details below.
          </p>
        </div>

        {/* Job Form */}
        <div className="bg-white rounded-lg shadow">
          <JobForm jobId={jobId} />
        </div>
      </div>
    </div>
  );
}

