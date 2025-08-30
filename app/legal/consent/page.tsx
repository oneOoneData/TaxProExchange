'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Logo from '@/components/Logo';

export default function LegalConsentPage() {
  const [acceptTos, setAcceptTos] = useState(false);
  const [acceptPrivacy, setAcceptPrivacy] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const canProceed = acceptTos && acceptPrivacy;

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
        throw new Error('Failed to save acceptance');
      }

      // Redirect based on where user came from
      const searchParams = new URLSearchParams(window.location.search);
      const redirectTo = searchParams.get('redirect') || '/profile/edit';
      router.push(redirectTo);
    } catch (err) {
      setError('Failed to save your acceptance. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-slate-50">
      <header className="sticky top-0 z-30 backdrop-blur bg-white/70 border-b border-slate-200">
        <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
          <Logo />
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
              Legal Consent Required
            </h1>
            <p className="text-slate-600">
              Please review and accept our updated legal documents to continue.
            </p>
          </div>

          <div className="space-y-6">
            {/* Terms of Use Checkbox */}
            <div className="flex items-start space-x-3">
              <input
                type="checkbox"
                id="acceptTos"
                checked={acceptTos}
                onChange={(e) => setAcceptTos(e.target.checked)}
                className="mt-1 h-4 w-4 text-slate-900 border-slate-300 rounded focus:ring-slate-500"
              />
              <div className="flex-1">
                <label htmlFor="acceptTos" className="text-sm font-medium text-slate-900">
                  I accept the{' '}
                  <Link 
                    href="/legal/terms" 
                    className="text-slate-600 hover:text-slate-800 underline"
                    target="_blank"
                  >
                    Terms of Use
                  </Link>
                </label>
                <p className="text-xs text-slate-500 mt-1">
                  By checking this box, you agree to be bound by our Terms of Use.
                </p>
              </div>
            </div>

            {/* Privacy Policy Checkbox */}
            <div className="flex items-start space-x-3">
              <input
                type="checkbox"
                id="acceptPrivacy"
                checked={acceptPrivacy}
                onChange={(e) => setAcceptPrivacy(e.target.checked)}
                className="mt-1 h-4 w-4 text-slate-900 border-slate-300 rounded focus:ring-slate-500"
              />
              <div className="flex-1">
                <label htmlFor="acceptPrivacy" className="text-sm font-medium text-slate-900">
                  I accept the{' '}
                  <Link 
                    href="/legal/privacy" 
                    className="text-slate-600 hover:text-slate-800 underline"
                    target="_blank"
                  >
                    Privacy Policy
                  </Link>
                </label>
                <p className="text-xs text-slate-500 mt-1">
                  By checking this box, you agree to our Privacy Policy and data practices.
                </p>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <button
              onClick={handleSubmit}
              disabled={!canProceed || isSubmitting}
              className="w-full flex items-center justify-center gap-3 rounded-xl bg-slate-900 text-white px-6 py-3 font-medium hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 1 4.373 1 8H4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Saving...
                </>
              ) : (
                'Continue to TaxProExchange'
              )}
            </button>

            <p className="text-xs text-slate-500 text-center">
              You must accept both documents to continue. You can review them by clicking the links above.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
