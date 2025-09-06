'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Logo from '@/components/Logo';
import CredentialSection from '@/components/forms/CredentialSection';
import { CredentialType, License } from '@/lib/validations/zodSchemas';

export default function CredentialsPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [credentialData, setCredentialData] = useState({
    credential_type: 'Student' as CredentialType,
    licenses: [] as License[]
  });

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

  const handleNext = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      // Update the profile with credential data only
      const updateData = {
        clerk_id: user.id,
        credential_type: credentialData.credential_type,
        licenses: credentialData.licenses
      };
      console.log('Sending update data:', updateData);
      
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.log('Error response:', errorData);
        throw new Error(errorData.error || 'Failed to save credentials');
      }

      // Redirect to profile edit to complete setup
      router.push('/profile/edit');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkip = () => {
    // Allow users to skip and add credentials later
    router.push('/profile/edit');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-slate-50">
      <header className="sticky top-0 z-30 backdrop-blur bg-white/70 border-b border-slate-200">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
          <Logo />
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <span className="px-2 py-1 bg-slate-100 rounded-full">Step 2 of 3</span>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8"
        >
          <div className="mb-8">
            <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1 className="text-3xl font-semibold text-slate-900 mb-4 text-center">
              Professional Credentials
            </h1>
            <p className="text-slate-600 text-center">
              Tell us about your professional credentials. This helps other professionals verify your qualifications.
            </p>
          </div>



          {/* Credential Form */}
          <div className="mb-8">
            <CredentialSection
              value={credentialData}
              onChange={setCredentialData}
              errors={error ? { general: error } : undefined}
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleNext}
              disabled={isSubmitting}
              className="flex-1 flex items-center justify-center gap-3 rounded-xl bg-slate-900 px-6 py-3 text-white hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Saving...
                </>
              ) : (
                'Complete Profile Setup'
              )}
            </button>
            
            <button
              onClick={handleSkip}
              disabled={isSubmitting}
              className="sm:w-auto px-6 py-3 text-slate-600 hover:text-slate-800 hover:bg-slate-50 rounded-xl transition-colors disabled:opacity-50"
            >
              Skip for Now
            </button>
          </div>

          <div className="mt-6 text-center">
            <p className="text-xs text-slate-500">
              You can always add or update your credentials later in your profile settings.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
