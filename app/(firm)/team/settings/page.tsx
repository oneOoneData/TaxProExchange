/**
 * Firm Settings Page
 * 
 * Manage subscription, team members, and firm account
 */

'use client';

import { useState, useEffect, Suspense } from 'react';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import Link from 'next/link';
import { FEATURE_FIRM_WORKSPACES } from '@/lib/flags';

interface Firm {
  id: string;
  name: string;
  subscription_status?: string;
  stripe_customer_id?: string;
  subscription_current_period_end?: string;
  user_role: string;
}

interface FirmMember {
  id: string;
  profile_id: string;
  role: string;
  status: string;
  created_at: string;
  profiles: {
    first_name: string;
    last_name: string;
    email?: string;
    public_email?: string;
    avatar_url?: string;
    image_url?: string;
  };
}

function FirmSettingsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isLoaded, userId } = useAuth();

  const [firms, setFirms] = useState<Firm[]>([]);
  const [selectedFirmId, setSelectedFirmId] = useState<string>('');
  const [firmMembers, setFirmMembers] = useState<FirmMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('member');
  const [inviteMessage, setInviteMessage] = useState('');
  const [isInviting, setIsInviting] = useState(false);
  const [inviteSuccess, setInviteSuccess] = useState<string | null>(null);

  // Guard: redirect if flag is off
  useEffect(() => {
    if (!FEATURE_FIRM_WORKSPACES) {
      router.push('/');
    }
  }, [router]);

  // Load user's firms
  useEffect(() => {
    if (!isLoaded || !userId) return;

    const loadFirms = async () => {
      try {
        const response = await fetch('/api/firms');
        if (response.ok) {
          const data = await response.json();
          const firmList = data.firms || [];
          setFirms(firmList);

          // Auto-select firm from query param or first firm
          const firmIdParam = searchParams.get('firmId');
          if (firmIdParam && firmList.some((f: Firm) => f.id === firmIdParam)) {
            setSelectedFirmId(firmIdParam);
          } else if (firmList.length > 0) {
            setSelectedFirmId(firmList[0].id);
          }
        }
      } catch (error) {
        console.error('Error loading firms:', error);
        setError('Failed to load firms');
      } finally {
        setIsLoading(false);
      }
    };

    loadFirms();
  }, [isLoaded, userId, searchParams]);

  // Load firm members when firm is selected
  useEffect(() => {
    if (!selectedFirmId) {
      setFirmMembers([]);
      return;
    }

    const loadFirmMembers = async () => {
      try {
        const response = await fetch(`/api/firm-members?firm_id=${selectedFirmId}`);
        if (response.ok) {
          const data = await response.json();
          setFirmMembers(data.members || []);
        }
      } catch (error) {
        console.error('Error loading firm members:', error);
      }
    };

    loadFirmMembers();
  }, [selectedFirmId]);

  const selectedFirm = firms.find((f) => f.id === selectedFirmId);
  const isAdmin = selectedFirm?.user_role === 'admin';
  const hasActiveSubscription = selectedFirm && 
    (selectedFirm.subscription_status === 'active' || selectedFirm.subscription_status === 'trialing');

  if (!isLoaded || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  if (firms.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">No Firm Found</h1>
          <Link href="/firm" className="text-blue-600 hover:text-blue-700 underline">
            Create a firm workspace
          </Link>
        </div>
      </div>
    );
  }

  const handleManageBilling = async () => {
    try {
      const response = await fetch('/api/stripe/customer-portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firmId: selectedFirmId }),
      });
      
      if (response.ok) {
        const { url } = await response.json();
        if (url) window.location.href = url;
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to open billing portal');
      }
    } catch (error) {
      console.error('Error opening billing portal:', error);
      setError('Failed to open billing portal');
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!confirm('Remove this team member? They will lose access to manage this firm.')) {
      return;
    }

    try {
      const response = await fetch(`/api/firm-members/${memberId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setFirmMembers(prev => prev.filter(m => m.id !== memberId));
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to remove member');
      }
    } catch (error) {
      console.error('Error removing member:', error);
      setError('Failed to remove member');
    }
  };

  const handleDeleteFirm = async () => {
    if (!isAdmin) {
      setError('Only admins can delete the firm');
      return;
    }

    try {
      const response = await fetch(`/api/firms/${selectedFirmId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        router.push('/dashboard');
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to delete firm');
      }
    } catch (error) {
      console.error('Error deleting firm:', error);
      setError('Failed to delete firm');
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 py-8">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Link
              href={`/team?firmId=${selectedFirmId}`}
              className="text-gray-600 hover:text-gray-900"
            >
              ← Back to Team
            </Link>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Firm Settings</h1>
          {selectedFirm && (
            <p className="text-gray-600 mt-2">{selectedFirm.name}</p>
          )}
        </div>

        {error && (
          <div className="mb-6 rounded-lg bg-red-50 p-4 border border-red-200">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Subscription Section */}
        <div className="bg-white shadow sm:rounded-lg mb-6">
          <div className="px-4 py-5 sm:p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Subscription</h2>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-700">Status</p>
                  <p className="text-sm text-gray-600 mt-1">
                    {hasActiveSubscription ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        {selectedFirm?.subscription_status || 'Inactive'}
                      </span>
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Plan</p>
                  <p className="text-sm text-gray-600 mt-1">
                    {hasActiveSubscription ? 'Firm Workspace - $30/month' : 'No active subscription'}
                  </p>
                </div>
              </div>

              {selectedFirm?.subscription_current_period_end && hasActiveSubscription && (
                <div>
                  <p className="text-sm font-medium text-gray-700">Next billing date</p>
                  <p className="text-sm text-gray-600 mt-1">
                    {new Date(selectedFirm.subscription_current_period_end).toLocaleDateString()}
                  </p>
                </div>
              )}

              {isAdmin && selectedFirm?.stripe_customer_id && (
                <div className="pt-4 border-t">
                  <button
                    onClick={handleManageBilling}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
                  >
                    Manage Billing & Cancel Subscription
                  </button>
                  <p className="text-xs text-gray-500 mt-2">
                    Update payment method, view invoices, or cancel your subscription
                  </p>
                </div>
              )}

              {!hasActiveSubscription && (
                <div className="pt-4 border-t">
                  <Link
                    href="/firm"
                    className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
                  >
                    Activate Subscription
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Team Members Section */}
        <div className="bg-white shadow sm:rounded-lg mb-6">
          <div className="px-4 py-5 sm:p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Team Members</h2>
            <p className="text-sm text-gray-600 mb-4">
              Team members can help manage your firm&rsquo;s bench of professionals. Admins have full control.
            </p>

            <div className="space-y-3">
              {firmMembers.map((member) => {
                const profile = member.profiles;
                const avatarUrl = profile.image_url || profile.avatar_url;
                const email = profile.email || profile.public_email;

                return (
                  <div key={member.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      {avatarUrl ? (
                        <Image
                          src={avatarUrl}
                          alt={`${profile.first_name} ${profile.last_name}`}
                          className="w-10 h-10 rounded-full"
                          width={40}
                          height={40}
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-semibold">
                          {profile.first_name[0]}{profile.last_name[0]}
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-gray-900">
                          {profile.first_name} {profile.last_name}
                        </p>
                        {email && (
                          <p className="text-sm text-gray-600">{email}</p>
                        )}
                      </div>
                      <span className={`ml-3 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        member.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                        member.role === 'manager' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {member.role}
                      </span>
                    </div>

                    {isAdmin && member.role !== 'admin' && (
                      <button
                        onClick={() => handleRemoveMember(member.id)}
                        className="text-sm text-red-600 hover:text-red-700 font-medium"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            {inviteSuccess && (
              <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
                <p className="text-sm text-green-800">{inviteSuccess}</p>
              </div>
            )}

            {isAdmin && (
              <div className="mt-4 pt-4 border-t">
                <p className="text-sm text-gray-600 mb-3">
                  Invite others to help manage your firm&rsquo;s bench of professionals.
                </p>
                <button
                  onClick={() => setShowInviteModal(true)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50"
                >
                  Invite Team Member
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Danger Zone */}
        {isAdmin && (
          <div className="bg-white shadow sm:rounded-lg border-2 border-red-200">
            <div className="px-4 py-5 sm:p-6">
              <h2 className="text-lg font-medium text-red-900 mb-2">Danger Zone</h2>
              <p className="text-sm text-gray-600 mb-4">
                Permanently delete this firm and all associated data. This action cannot be undone.
              </p>

              {!showDeleteConfirm ? (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700"
                >
                  Delete Firm Account
                </button>
              ) : (
                <div className="p-4 bg-red-50 rounded-lg">
                  <p className="text-sm text-red-900 font-medium mb-3">
                    Are you absolutely sure? This will:
                  </p>
                  <ul className="text-sm text-red-800 mb-4 list-disc list-inside space-y-1">
                    <li>Cancel your subscription</li>
                    <li>Remove all team members</li>
                    <li>Delete your bench of professionals</li>
                    <li>Remove all firm data permanently</li>
                  </ul>
                  <div className="flex gap-3">
                    <button
                      onClick={handleDeleteFirm}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700"
                    >
                      Yes, Delete Permanently
                    </button>
                    <button
                      onClick={() => setShowDeleteConfirm(false)}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Invite Modal */}
        {showInviteModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Invite Team Member</h3>
              
              <div className="space-y-4">
                <div>
                  <label htmlFor="invite-email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    id="invite-email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="colleague@example.com"
                  />
                </div>

                <div>
                  <label htmlFor="invite-role" className="block text-sm font-medium text-gray-700 mb-1">
                    Role <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="invite-role"
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="member">Member - Can manage bench</option>
                    <option value="manager">Manager - Can manage bench & invite members</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="invite-message" className="block text-sm font-medium text-gray-700 mb-1">
                    Personal Message (Optional)
                  </label>
                  <textarea
                    id="invite-message"
                    value={inviteMessage}
                    onChange={(e) => setInviteMessage(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Add a personal note..."
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={async () => {
                    if (!inviteEmail) {
                      setError('Please enter an email address');
                      return;
                    }

                    setIsInviting(true);
                    setError(null);

                    try {
                      const response = await fetch('/api/firm-members/invite', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          firmId: selectedFirmId,
                          email: inviteEmail,
                          role: inviteRole,
                          message: inviteMessage || undefined,
                        }),
                      });

                      const data = await response.json();

                      if (!response.ok) {
                        throw new Error(data.error || 'Failed to send invitation');
                      }

                      setInviteSuccess(`Invitation sent to ${inviteEmail}!`);
                      setShowInviteModal(false);
                      setInviteEmail('');
                      setInviteMessage('');
                      setInviteRole('member');

                      // Clear success message after 5 seconds
                      setTimeout(() => setInviteSuccess(null), 5000);

                    } catch (err: any) {
                      setError(err.message);
                    } finally {
                      setIsInviting(false);
                    }
                  }}
                  disabled={isInviting}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
                >
                  {isInviting ? 'Sending...' : 'Send Invitation'}
                </button>
                <button
                  onClick={() => {
                    setShowInviteModal(false);
                    setInviteEmail('');
                    setInviteMessage('');
                    setError(null);
                  }}
                  disabled={isInviting}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

export default function FirmSettingsPage() {
  if (!FEATURE_FIRM_WORKSPACES) {
    return null;
  }

  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Loading settings...</div>
      </div>
    }>
      <FirmSettingsContent />
    </Suspense>
  );
}

