'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Logo from '@/components/Logo';
import SpecializationPicker from '@/components/SpecializationPicker';

export default function SpecializationsPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [selected, setSelected] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const handleToggle = (value: string) => {
    setSelected((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    );
  };

  const handleNext = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      if (selected.length > 0) {
        const res = await fetch('/api/profile/update-specializations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ specializations: selected }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || 'Failed to save specializations');
        }
      }
      router.push('/profile/edit');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkip = () => {
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

      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="mb-8 text-center">
            <div className="mx-auto w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <h1 className="text-3xl font-semibold text-slate-900 mb-2">Your Specializations</h1>
            <p className="text-slate-600 max-w-xl mx-auto">
              Select the areas where you have expertise. This helps other professionals find you for the right work.
              {selected.length > 0 && (
                <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-sm font-medium">
                  {selected.length} selected
                </span>
              )}
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-6">
            <SpecializationPicker
              selected={selected}
              onToggle={handleToggle}
              onClear={() => setSelected([])}
              title="Tax Specializations"
              subtitle="Select all areas where you have expertise and experience"
            />
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleNext}
              disabled={isSubmitting}
              className="flex-1 flex items-center justify-center gap-3 rounded-xl bg-slate-900 px-6 py-3 text-white font-medium hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Saving...
                </>
              ) : (
                selected.length > 0 ? `Save & Continue (${selected.length} selected)` : 'Continue'
              )}
            </button>
            <button
              onClick={handleSkip}
              disabled={isSubmitting}
              className="px-6 py-3 rounded-xl border border-slate-300 text-slate-600 font-medium hover:bg-slate-50 disabled:opacity-50 transition-colors"
            >
              Skip for now
            </button>
          </div>

          <p className="mt-4 text-center text-xs text-slate-500">
            You can update your specializations anytime from your profile settings.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
