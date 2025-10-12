/**
 * Firm Onboarding Page
 * 
 * Shows landing page for unauthenticated users.
 * Shows firm creation form for authenticated users.
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import { FEATURE_FIRM_WORKSPACES } from '@/lib/flags';
import Link from 'next/link';
import Logo from '@/components/Logo';

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

  // Not signed in - show landing page
  if (!userId) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
        {/* Header */}
        <header className="sticky top-0 z-30 backdrop-blur bg-white/70 border-b border-slate-200">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
            <Logo />
            <div className="flex items-center gap-3">
              <Link
                href="/sign-in"
                className="px-4 py-2 text-sm font-medium text-slate-700 hover:text-slate-900"
              >
                Log In
              </Link>
              <Link
                href="/join"
                className="px-4 py-2 text-sm font-medium rounded-md text-white bg-slate-900 hover:bg-slate-800"
              >
                Sign Up
              </Link>
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
              Build Your Firm's
              <span className="block text-blue-600 mt-2">Trusted Bench</span>
            </h1>
            
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Create a curated team of verified tax professionals. Manage your extended network, collaborate on projects, and showcase your firm's capabilities.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
              <Link
                href="/join"
                className="px-8 py-4 text-lg font-semibold rounded-lg text-white bg-blue-600 hover:bg-blue-700 shadow-lg hover:shadow-xl transition-all"
              >
                Get Started - It's Free
              </Link>
              <Link
                href="/sign-in"
                className="px-8 py-4 text-lg font-semibold rounded-lg text-blue-600 bg-white border-2 border-blue-600 hover:bg-blue-50 transition-all"
              >
                Log In to Your Firm
              </Link>
            </div>

            {/* Features Grid */}
            <div className="grid md:grid-cols-3 gap-8 mt-20">
              <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Build Your Bench</h3>
                <p className="text-gray-600">
                  Invite verified CPAs, EAs, and tax professionals to join your firm's trusted network.
                </p>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Trust & Verification</h3>
                <p className="text-gray-600">
                  All professionals are verified. Build relationships with confidence and transparency.
                </p>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Showcase Your Team</h3>
                <p className="text-gray-600">
                  Create a public-facing team page to highlight your firm's capabilities and expertise.
                </p>
              </div>
            </div>

            {/* Pricing */}
            <div className="mt-20 bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-8 border border-blue-100">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Simple, Transparent Pricing</h2>
              <div className="text-5xl font-bold text-blue-600 mb-2">$10<span className="text-2xl text-gray-600">/month</span></div>
              <p className="text-gray-600 mb-6">No contracts. Cancel anytime.</p>
              
              <ul className="text-left max-w-md mx-auto space-y-3 mb-8">
                <li className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-700">Unlimited team member invitations</span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-700">Public firm profile page</span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-700">Team organization & management</span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-700">Access to verified professional directory</span>
                </li>
              </ul>

              <Link
                href="/join"
                className="inline-block px-8 py-4 text-lg font-semibold rounded-lg text-white bg-blue-600 hover:bg-blue-700 shadow-lg hover:shadow-xl transition-all"
              >
                Start Your Free Trial
              </Link>
            </div>

            {/* Bottom CTA */}
            <div className="mt-16 text-center">
              <p className="text-gray-600 mb-4">Already have an account?</p>
              <Link
                href="/sign-in"
                className="text-blue-600 font-semibold hover:text-blue-700 text-lg"
              >
                Log in to access your firm workspace →
              </Link>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="border-t border-gray-200 py-8 mt-16">
          <div className="container mx-auto px-4 text-center">
            <div className="flex flex-wrap justify-center gap-6 text-sm text-gray-600 mb-4">
              <Link href="/trust" className="hover:text-gray-900">Trust & Verification</Link>
              <Link href="/transparency" className="hover:text-gray-900">Transparency</Link>
              <Link href="/legal/privacy" className="hover:text-gray-900">Privacy</Link>
              <Link href="/legal/terms" className="hover:text-gray-900">Terms</Link>
            </div>
            <p className="text-sm text-gray-500">© 2025 TaxProExchange</p>
          </div>
        </footer>
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

