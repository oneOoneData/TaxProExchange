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

  if (!isLoaded || !userId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
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
      
      // Redirect to team dashboard
      router.push(`/firm/dashboard/team?firmId=${data.firm.id}`);
    } catch (err: any) {
      setError(err.message);
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl">
        <div className="bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Create Your Firm Workspace
            </h1>
            <p className="text-gray-600 mb-6">
              Set up your firm profile to start building your trusted bench of professionals.
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
                  {isSubmitting ? 'Creating...' : 'Create Firm Workspace'}
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

