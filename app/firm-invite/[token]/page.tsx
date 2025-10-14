/**
 * Firm Member Invitation Acceptance Page
 * /firm-invite/[token]
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import Link from 'next/link';

interface InvitationDetails {
  firm_name: string;
  invited_email: string;
  role: string;
  invited_by_name: string;
  message?: string;
  expires_at: string;
}

export default function FirmInvitePage({ params }: { params: Promise<{ token: string }> }) {
  const [token, setToken] = useState<string>('');

  useEffect(() => {
    params.then((p) => setToken(p.token));
  }, [params]);
  const router = useRouter();
  const { isLoaded, userId } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [invitation, setInvitation] = useState<InvitationDetails | null>(null);

  useEffect(() => {
    if (isLoaded && !userId && token) {
      // Redirect to sign in with return URL
      router.push(`/sign-in?redirect_url=/firm-invite/${token}`);
    }
  }, [isLoaded, userId, router, token]);

  // Load invitation details (you'd need an endpoint for this)
  useEffect(() => {
    if (!userId) return;

    // For now, we'll handle this on accept/decline
    // In a full implementation, you'd fetch invitation details here
  }, [userId]);

  const handleResponse = async (action: 'accept' | 'decline') => {
    if (!token) return;
    
    setIsProcessing(true);
    setError(null);

    try {
      const response = await fetch(`/api/firm-members/invite/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `Failed to ${action} invitation`);
      }

      if (action === 'accept') {
        setSuccess(true);
        // Redirect to dashboard after 2 seconds
        setTimeout(() => {
          router.push('/dashboard');
        }, 2000);
      } else {
        // Declined - redirect to dashboard
        setTimeout(() => {
          router.push('/dashboard');
        }, 2000);
      }

    } catch (err: any) {
      setError(err.message);
      setIsProcessing(false);
    }
  };

  if (!isLoaded || !userId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Invitation Accepted!</h1>
          <p className="text-gray-600">
            Redirecting you to the firm workspace...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Firm Team Invitation</h1>
          <p className="text-gray-600">
            You've been invited to join a firm team on TaxProExchange
          </p>
        </div>

        {error && (
          <div className="mb-6 rounded-lg bg-red-50 p-4 border border-red-200">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600 mb-2">
            As a team member, you'll be able to:
          </p>
          <ul className="text-sm text-gray-700 space-y-1">
            <li className="flex items-start gap-2">
              <svg className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Help manage the firm's bench of trusted professionals</span>
            </li>
            <li className="flex items-start gap-2">
              <svg className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Invite and organize tax professionals</span>
            </li>
            <li className="flex items-start gap-2">
              <svg className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Collaborate with the firm team</span>
            </li>
          </ul>
        </div>

        <div className="space-y-3">
          <button
            onClick={() => handleResponse('accept')}
            disabled={isProcessing}
            className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isProcessing ? 'Processing...' : 'Accept Invitation'}
          </button>
          
          <button
            onClick={() => handleResponse('decline')}
            disabled={isProcessing}
            className="w-full px-4 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Decline
          </button>
        </div>

        <p className="mt-6 text-xs text-center text-gray-500">
          Need help? <Link href="/feedback" className="text-blue-600 hover:text-blue-700 underline">Contact support</Link>
        </p>
      </div>
    </div>
  );
}

