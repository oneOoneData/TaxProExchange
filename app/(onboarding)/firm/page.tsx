/**
 * Firm Onboarding Page
 * 
 * Simple form to create a new firm workspace.
 * User becomes admin member upon creation.
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import { FEATURE_FIRM_WORKSPACES } from '@/lib/flags';

export default function FirmOnboardingPage() {
  // Early return if feature is disabled (server-safe)
  if (!FEATURE_FIRM_WORKSPACES) {
    return null;
  }

  const router = useRouter();
  const { isLoaded, userId } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    website: '',
    size_band: '',
    returns_band: '',
  });

  // Guard: redirect to home (client-side only)
  useEffect(() => {
    if (!FEATURE_FIRM_WORKSPACES) {
      router.push('/');
    }
  }, [router]);

  // Loading state
  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  // Not signed in - redirect to sign-in
  if (!userId) {
    router.push('/sign-in?redirect_url=/firm');
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Redirecting to sign in...</div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      // Step 1: Create the firm
      const response = await fetch('/api/firms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create firm');
      }

      const data = await response.json();
      const firmId = data.firm.id;
      
      // Step 2: Create Stripe Checkout Session
      const checkoutResponse = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firmId }),
      });

      if (!checkoutResponse.ok) {
        const checkoutData = await checkoutResponse.json();
        throw new Error(checkoutData.error || 'Failed to create checkout session');
      }

      const { url } = await checkoutResponse.json();
      
      // Step 3: Redirect to Stripe Checkout
      if (url) {
        window.location.href = url;
      } else {
        throw new Error('No checkout URL received');
      }
    } catch (err: any) {
      setError(err.message);
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Create Your Firm Workspace
          </h1>
          <p className="text-lg text-gray-600">
            Build and manage your trusted bench of verified tax professionals
          </p>
        </div>

        {/* Process Overview */}
        <div className="bg-white shadow-sm sm:rounded-lg mb-8 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {/* Step 1 */}
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold mb-2">
                1
              </div>
              <h3 className="font-medium text-gray-900 text-sm mb-1">Firm Details</h3>
              <p className="text-xs text-gray-600">Provide your firm info</p>
            </div>

            {/* Arrow */}
            <div className="hidden md:flex items-center justify-center">
              <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>

            {/* Step 2 */}
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold mb-2">
                2
              </div>
              <h3 className="font-medium text-gray-900 text-sm mb-1">Subscribe</h3>
              <p className="text-xs text-gray-600">$10/month</p>
            </div>

            {/* Arrow */}
            <div className="hidden md:flex items-center justify-center">
              <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>

            {/* Step 3 */}
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold mb-2">
                3
              </div>
              <h3 className="font-medium text-gray-900 text-sm mb-1">Build Team</h3>
              <p className="text-xs text-gray-600">Access your workspace</p>
            </div>
          </div>
        </div>

        {/* What You Get */}
        <div className="bg-gradient-to-br from-blue-50 to-white border-2 border-blue-200 shadow-sm sm:rounded-lg mb-8 p-6">
          <h2 className="text-lg font-semibold text-blue-900 mb-4">What You Get with Firm Workspace</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <div>
                <h3 className="font-medium text-gray-900 text-sm">Trusted Bench</h3>
                <p className="text-xs text-gray-600">Invite verified pros to your team roster</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <div>
                <h3 className="font-medium text-gray-900 text-sm">Team Management</h3>
                <p className="text-xs text-gray-600">Add firm members to help manage your bench</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <div>
                <h3 className="font-medium text-gray-900 text-sm">Organize by Specialty</h3>
                <p className="text-xs text-gray-600">Categorize pros by S-Corp, IRS, SALT, etc.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <div>
                <h3 className="font-medium text-gray-900 text-sm">Internal Notes</h3>
                <p className="text-xs text-gray-600">Keep private team notes about each pro</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <div>
                <h3 className="font-medium text-gray-900 text-sm">Direct Messaging</h3>
                <p className="text-xs text-gray-600">Message professionals directly from your bench</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <div>
                <h3 className="font-medium text-gray-900 text-sm">Public Profile (Optional)</h3>
                <p className="text-xs text-gray-600">Showcase your extended team publicly</p>
              </div>
            </div>
          </div>
        </div>

        {/* Firm Details Form */}
        <div className="bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-sm">
                1
              </div>
              <h2 className="text-xl font-bold text-gray-900">
                Step 1: Firm Details
              </h2>
            </div>
            <p className="text-gray-600 mb-6">
              Tell us about your firm. You'll complete payment in the next step ($10/month, cancel anytime).
            </p>

            {error && (
              <div className="mb-4 rounded-md bg-red-50 p-4">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Firm Name */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Firm Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                  placeholder="e.g., Smith & Associates CPA"
                />
              </div>

              {/* Website */}
              <div>
                <label htmlFor="website" className="block text-sm font-medium text-gray-700">
                  Website (Optional)
                </label>
                <input
                  type="url"
                  id="website"
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                  placeholder="https://example.com"
                />
              </div>

              {/* Firm Size */}
              <div>
                <label htmlFor="size_band" className="block text-sm font-medium text-gray-700">
                  Firm Size
                </label>
                <select
                  id="size_band"
                  value={formData.size_band}
                  onChange={(e) => setFormData({ ...formData, size_band: e.target.value })}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                >
                  <option value="">Select size</option>
                  <option value="1-4">1-4 employees</option>
                  <option value="5-10">5-10 employees</option>
                  <option value="11-25">11-25 employees</option>
                  <option value="26-50">26-50 employees</option>
                  <option value="50+">50+ employees</option>
                </select>
              </div>

              {/* Returns Volume */}
              <div>
                <label htmlFor="returns_band" className="block text-sm font-medium text-gray-700">
                  Annual Returns Volume
                </label>
                <select
                  id="returns_band"
                  value={formData.returns_band}
                  onChange={(e) => setFormData({ ...formData, returns_band: e.target.value })}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                >
                  <option value="">Select volume</option>
                  <option value="<100">Less than 100</option>
                  <option value="<1,000">100 - 1,000</option>
                  <option value="<5,000">1,000 - 5,000</option>
                  <option value="5,000+">5,000+</option>
                </select>
              </div>

              {/* Submit Button */}
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Creating firm...' : 'Continue to Step 2: Payment'}
                </button>
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </main>
  );
}

