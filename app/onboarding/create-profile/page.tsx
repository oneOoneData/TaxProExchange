'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Logo from '@/components/Logo';

export default function CreateProfilePage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Redirect if not authenticated
  useEffect(() => {
    if (isLoaded && !user) {
      router.push('/sign-in');
    }
  }, [isLoaded, user, router]);

  if (!isLoaded || !user) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-slate-900"></div>
      </div>
    );
  }

  const handleCreateProfile = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      // Create a basic profile first
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clerk_id: user.id,
          first_name: user.firstName || 'New',
          last_name: user.lastName || 'User',
          public_email: user.primaryEmailAddress?.emailAddress || '',
          credential_type: 'Student', // Default to Student, will be updated in credentials step
          licenses: []
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create profile');
      }

      // Redirect to credentials step
      router.push('/onboarding/credentials');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-slate-50">
      <header className="sticky top-0 z-30 backdrop-blur bg-white/70 border-b border-slate-200">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
          <Logo />
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <span className="px-2 py-1 bg-slate-100 rounded-full">Step 1 of 2</span>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 text-center"
        >
          <div className="mb-8">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-3xl font-semibold text-slate-900 mb-4">
              Legal Documents Accepted
            </h1>
            <p className="text-slate-600">
              Great! Now let's create your professional profile on TaxProExchange.
            </p>
          </div>

          <div className="bg-slate-50 rounded-lg p-6 mb-8 text-left">
            <h3 className="font-medium text-slate-900 mb-3">What happens next?</h3>
            <ul className="space-y-2 text-sm text-slate-600">
              <li className="flex items-start gap-2">
                <span className="text-green-500 mt-1">✓</span>
                <span>We'll create your basic profile with your name and email</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500 mt-1">→</span>
                <span>Complete your profile with credentials, specializations, and contact info</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500 mt-1">→</span>
                <span>Start connecting with other tax professionals</span>
              </li>
            </ul>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Create Profile Button */}
          <button
            onClick={handleCreateProfile}
            disabled={isSubmitting}
            className="w-full flex items-center justify-center gap-3 rounded-xl bg-slate-900 px-6 py-3 text-white hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Creating Profile...
              </>
            ) : (
              'Create My Profile'
            )}
          </button>

          <div className="mt-6 text-center">
            <p className="text-xs text-slate-500">
              Your profile will be created with basic information from your account.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
