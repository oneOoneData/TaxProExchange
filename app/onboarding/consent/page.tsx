'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useClerk } from '@clerk/nextjs';
import Logo from '@/components/Logo';

export default function OnboardingConsentPage() {
  const [acceptTos, setAcceptTos] = useState(false);
  const [acceptPrivacy, setAcceptPrivacy] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { signOut } = useClerk();

  const canProceed = acceptTos && acceptPrivacy;

  const handleCancel = async () => {
    try {
      await signOut();
      router.push('/');
    } catch (error) {
      console.error('Error signing out:', error);
      // Fallback: just redirect to home page
      router.push('/');
    }
  };

  const handleSubmit = async () => {
    if (!canProceed) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/legal/accept', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          acceptTos: true,
          acceptPrivacy: true,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to record acceptance');
      }

      // Redirect to profile creation
      router.push('/onboarding/create-profile');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-slate-50">
      <header className="sticky top-0 z-30 backdrop-blur bg-white/70 border-b border-slate-200">
        <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
          <Logo />
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <span className="px-2 py-1 bg-slate-100 rounded-full">Step 1 of 2</span>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-2xl px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl border border-slate-200 p-8"
        >
          <div className="text-center mb-8">
            <h1 className="text-3xl font-semibold text-slate-900 mb-4">
              Welcome to TaxProExchange
            </h1>
            <p className="text-slate-600">
              Before we create your profile, please review and accept our legal documents.
            </p>
          </div>

          {/* Legal Acceptance Checkboxes */}
          <div className="space-y-6 mb-8">
            {/* Terms of Use */}
            <div className="flex items-start space-x-3 p-4 border border-slate-200 rounded-lg">
              <input
                type="checkbox"
                id="acceptTos"
                checked={acceptTos}
                onChange={(e) => setAcceptTos(e.target.checked)}
                className="mt-1 h-4 w-4 text-slate-900 border-slate-300 rounded focus:ring-slate-500"
                required
              />
              <div className="flex-1">
                <label htmlFor="acceptTos" className="text-sm font-medium text-slate-700">
                  I have read and agree to the{' '}
                  <Link 
                    href="/legal/terms" 
                    target="_blank"
                    className="text-slate-600 hover:text-slate-800 underline"
                  >
                    Terms of Use
                  </Link>
                </label>
                <p className="text-xs text-slate-500 mt-1">
                  You must accept our Terms of Use to continue.
                </p>
              </div>
            </div>

            {/* Privacy Policy */}
            <div className="flex items-start space-x-3 p-4 border border-slate-200 rounded-lg">
              <input
                type="checkbox"
                id="acceptPrivacy"
                checked={acceptPrivacy}
                onChange={(e) => setAcceptPrivacy(e.target.checked)}
                className="mt-1 h-4 w-4 text-slate-900 border-slate-300 rounded focus:ring-slate-500"
                required
              />
              <div className="flex-1">
                <label htmlFor="acceptPrivacy" className="text-sm font-medium text-slate-700">
                  I have read and agree to the{' '}
                  <Link 
                    href="/legal/privacy" 
                    target="_blank"
                    className="text-slate-600 hover:text-slate-800 underline"
                  >
                    Privacy Policy
                  </Link>
                </label>
                <p className="text-xs text-slate-500 mt-1">
                  You must accept our Privacy Policy to continue.
                </p>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Submit Button */}
          <div className="space-y-3">
            <button
              onClick={handleSubmit}
              disabled={!canProceed || isSubmitting}
              className="w-full flex items-center justify-center gap-3 rounded-xl bg-slate-900 px-6 py-3 text-white hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </>
              ) : (
                'Continue to Profile Creation'
              )}
            </button>

            <button
              onClick={handleCancel}
              className="w-full flex items-center justify-center gap-2 rounded-xl border border-slate-300 px-6 py-3 text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Cancel & Return to Home
            </button>
          </div>

          <div className="mt-6 text-center">
            <p className="text-xs text-slate-500">
              By continuing, you acknowledge that you have read and understood our legal documents.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
