/**
 * Team Invitations Page
 * 
 * Professionals can view and respond to firm team invitations
 */

'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import Link from 'next/link';

interface Invitation {
  id: string;
  firm_id: string;
  message?: string;
  custom_title_offer?: string;
  status: string;
  created_at: string;
  expires_at: string;
  firms: {
    id: string;
    name: string;
    slug: string;
    website?: string;
  };
  inviter: {
    id: string;
    first_name: string;
    last_name: string;
  };
}

function InvitationsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isLoaded, userId } = useAuth();
  
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [respondingId, setRespondingId] = useState<string | null>(null);

  // Handle action from email link
  useEffect(() => {
    const inviteId = searchParams.get('id');
    const action = searchParams.get('action');
    
    if (inviteId && action && (action === 'accept' || action === 'decline')) {
      handleRespond(inviteId, action);
    }
  }, [searchParams]);

  // Load invitations
  useEffect(() => {
    if (!isLoaded || !userId) return;

    const loadInvitations = async () => {
      try {
        const response = await fetch('/api/firm-team/invite?view=received');
        if (response.ok) {
          const data = await response.json();
          setInvitations(data.invitations || []);
        }
      } catch (error) {
        console.error('Error loading invitations:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadInvitations();
  }, [isLoaded, userId]);

  const handleRespond = async (invitationId: string, action: 'accept' | 'decline') => {
    setRespondingId(invitationId);
    try {
      const response = await fetch(`/api/firm-team/invite/${invitationId}/respond`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to respond to invitation');
      }

      const data = await response.json();
      
      // Update local state
      setInvitations(prev => 
        prev.map(inv => 
          inv.id === invitationId 
            ? { ...inv, status: action === 'accept' ? 'accepted' : 'declined' }
            : inv
        )
      );

      alert(data.message);
    } catch (error: any) {
      console.error('Error responding to invitation:', error);
      alert(error.message || 'Failed to respond to invitation');
    } finally {
      setRespondingId(null);
    }
  };

  if (!isLoaded || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Loading invitations...</div>
      </div>
    );
  }

  const pendingInvitations = invitations.filter(i => i.status === 'pending');
  const respondedInvitations = invitations.filter(i => i.status !== 'pending');

  return (
    <main className="min-h-screen bg-gray-50 py-8">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Team Invitations</h1>
          <p className="text-gray-600 mt-2">
            Firms that want to add you to their trusted bench
          </p>
        </div>

        {/* Pending Invitations */}
        {pendingInvitations.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Pending ({pendingInvitations.length})
            </h2>
            <div className="space-y-4">
              {pendingInvitations.map((invitation) => (
                <div key={invitation.id} className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {invitation.firms.name}
                      </h3>
                      <p className="text-sm text-gray-600">
                        Invited by {invitation.inviter.first_name} {invitation.inviter.last_name}
                      </p>
                      {invitation.custom_title_offer && (
                        <div className="mt-2 inline-block px-3 py-1 bg-blue-50 border border-blue-200 rounded-md">
                          <p className="text-sm text-blue-900">
                            <strong>Suggested Role:</strong> {invitation.custom_title_offer}
                          </p>
                        </div>
                      )}
                    </div>
                    {invitation.firms.website && (
                      <a
                        href={invitation.firms.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:text-blue-700"
                      >
                        Visit website →
                      </a>
                    )}
                  </div>

                  {invitation.message && (
                    <div className="bg-gray-50 border-l-4 border-blue-400 p-4 rounded mb-4">
                      <p className="text-gray-700 italic">"{invitation.message}"</p>
                    </div>
                  )}

                  <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-4">
                    <p className="text-sm text-blue-900">
                      <strong>What this means:</strong> By accepting, you'll be added to {invitation.firms.name}'s trusted bench. 
                      They may reach out when they have overflow work or need your expertise. You're not committing to any 
                      specific work—just signaling you're open to opportunities.
                    </p>
                  </div>

                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-500">
                      Expires {new Date(invitation.expires_at).toLocaleDateString()}
                    </p>
                    <div className="flex gap-3">
                      <button
                        onClick={() => handleRespond(invitation.id, 'decline')}
                        disabled={respondingId === invitation.id}
                        className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 disabled:opacity-50"
                      >
                        Decline
                      </button>
                      <button
                        onClick={() => handleRespond(invitation.id, 'accept')}
                        disabled={respondingId === invitation.id}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
                      >
                        {respondingId === invitation.id ? 'Processing...' : 'Accept Invitation'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State for Pending */}
        {pendingInvitations.length === 0 && respondedInvitations.length === 0 && (
          <div className="text-center py-16 bg-white rounded-lg border-2 border-dashed border-gray-300">
            <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No invitations yet</h3>
            <p className="text-gray-600 mb-6">
              When firms invite you to their team, you'll see invitations here.
            </p>
            <Link
              href="/search"
              className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700"
            >
              Browse Directory
            </Link>
          </div>
        )}

        {/* Responded Invitations */}
        {respondedInvitations.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Previous Responses
            </h2>
            <div className="space-y-3">
              {respondedInvitations.map((invitation) => (
                <div key={invitation.id} className="bg-white rounded-lg border border-gray-200 p-4 opacity-75">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-900">{invitation.firms.name}</h3>
                      <p className="text-sm text-gray-600">
                        {invitation.custom_title_offer || 'Team member'}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                        invitation.status === 'accepted' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {invitation.status === 'accepted' ? '✓ Accepted' : 'Declined'}
                      </span>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(invitation.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

export default function InvitationsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    }>
      <InvitationsContent />
    </Suspense>
  );
}


