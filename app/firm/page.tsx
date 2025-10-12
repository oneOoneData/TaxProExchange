'use client';

import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';
import Logo from '@/components/Logo';

export default function FirmLandingPage() {
  const { isLoaded, isSignedIn } = useUser();
  const router = useRouter();

  // Redirect authenticated users to their team dashboard
  useEffect(() => {
    if (isLoaded && isSignedIn) {
      router.push('/team');
    }
  }, [isLoaded, isSignedIn, router]);

  // Show nothing while checking auth or if already signed in
  if (!isLoaded || isSignedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

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

