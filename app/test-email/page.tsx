'use client';

import { useState } from 'react';
import { useAuth } from '@clerk/nextjs';

export default function TestEmailPage() {
  const { isSignedIn, userId } = useAuth();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const testResend = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/test/resend', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (response.ok) {
        setResult(data);
      } else {
        setError(data.error || 'Failed to send test email');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error');
    } finally {
      setLoading(false);
    }
  };

  const checkProfile = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/test/resend', {
        method: 'GET',
      });

      const data = await response.json();

      if (response.ok) {
        setResult(data);
      } else {
        setError(data.error || 'Failed to check profile');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error');
    } finally {
      setLoading(false);
    }
  };

  if (!isSignedIn) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Test Email Page</h1>
          <p className="text-gray-600">Please sign in to test the email functionality.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">🧪 Resend Email Test</h1>
          
          <div className="space-y-6">
            {/* Profile Check Section */}
            <div className="border border-gray-200 rounded-lg p-4">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">1. Check Your Profile</h2>
              <p className="text-gray-600 mb-3">
                First, let&rsquo;s verify your profile has an email address configured.
              </p>
              <button
                onClick={checkProfile}
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white px-4 py-2 rounded-md transition-colors"
              >
                {loading ? 'Checking...' : 'Check Profile'}
              </button>
            </div>

            {/* Email Test Section */}
            <div className="border border-gray-200 rounded-lg p-4">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">2. Send Test Email</h2>
              <p className="text-gray-600 mb-3">
                Send a test email to verify Resend is working correctly.
              </p>
              <button
                onClick={testResend}
                disabled={loading}
                className="bg-green-600 hover:bg-green-700 disabled:bg-green-300 text-white px-4 py-2 rounded-md transition-colors"
              >
                {loading ? 'Sending...' : 'Send Test Email'}
              </button>
            </div>

            {/* Results Section */}
            {result && (
              <div className="border border-gray-200 rounded-lg p-4">
                <h2 className="text-lg font-semibold text-gray-900 mb-3">Results</h2>
                <div className="bg-gray-50 rounded-md p-3">
                  <pre className="text-sm text-gray-800 whitespace-pre-wrap">
                    {JSON.stringify(result, null, 2)}
                  </pre>
                </div>
              </div>
            )}

            {/* Error Section */}
            {error && (
              <div className="border border-red-200 rounded-lg p-4 bg-red-50">
                <h2 className="text-lg font-semibold text-red-900 mb-3">Error</h2>
                <p className="text-red-700">{error}</p>
              </div>
            )}

            {/* Instructions */}
            <div className="border border-gray-200 rounded-lg p-4 bg-blue-50">
              <h2 className="text-lg font-semibold text-blue-900 mb-3">How to Test</h2>
              <ol className="list-decimal list-inside space-y-2 text-blue-800">
                <li>Make sure you have a <code className="bg-blue-100 px-1 rounded">RESEND_API_KEY</code> in your environment variables</li>
                <li>Ensure your profile has a <code className="bg-blue-100 px-1 rounded">public_email</code> field set</li>
                <li>Click &quot;Check Profile&quot; to verify your email is configured</li>
                <li>Click &quot;Send Test Email&quot; to send a test email</li>
                <li>Check your email inbox for the test message</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
