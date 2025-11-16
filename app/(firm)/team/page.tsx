/**
 * Firm Team Dashboard
 * 
 * Manage firm's trusted bench of professionals.
 * Gated by FEATURE_FIRM_WORKSPACES flag and membership.
 */

'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import Link from 'next/link';
import Image from 'next/image';
import BenchCard from '@/components/bench/BenchCard';
import AddFromDirectory from '@/components/bench/AddFromDirectory';

export const dynamic = 'force-dynamic';

interface Firm {
  id: string;
  name: string;
  slug: string;
  user_role: string;
  subscription_status?: string;
  stripe_customer_id?: string;
  subscription_current_period_end?: string;
  trial_ends_at?: string;
}

interface PendingInvitation {
  id: string;
  profile_id: string;
  message?: string;
  custom_title_offer?: string;
  status: string;
  created_at: string;
  expires_at: string;
  profiles: {
    id: string;
    first_name: string;
    last_name: string;
    credential_type: string;
    slug: string;
    firm_name?: string;
    avatar_url?: string;
    image_url?: string;
    headline?: string;
  };
}

function TeamDashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isLoaded, userId } = useAuth();

  const [firms, setFirms] = useState<Firm[]>([]);
  const [selectedFirmId, setSelectedFirmId] = useState<string>('');
  const [benchItems, setBenchItems] = useState<any[]>([]);
  const [pendingInvites, setPendingInvites] = useState<PendingInvitation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingBench, setIsLoadingBench] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkoutStatus, setCheckoutStatus] = useState<string | null>(null);

  // Handle checkout success/cancel status
  useEffect(() => {
    const checkout = searchParams.get('checkout');
    if (checkout === 'success') {
      setCheckoutStatus('success');
      // Clear the query param after showing the message
      setTimeout(() => setCheckoutStatus(null), 5000);
    } else if (checkout === 'canceled') {
      setCheckoutStatus('canceled');
      setTimeout(() => setCheckoutStatus(null), 5000);
    }
  }, [searchParams]);

  useEffect(() => {
    if (isLoaded && !userId) {
      router.push('/sign-in');
    }
  }, [isLoaded, userId, router]);

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

  // Load bench items and pending invitations when firm is selected
  useEffect(() => {
    if (!selectedFirmId) {
      setBenchItems([]);
      setPendingInvites([]);
      return;
    }

    const loadTeamData = async () => {
      setIsLoadingBench(true);
      try {
        // Load accepted team members
        const benchResponse = await fetch(`/api/firm-team?firm_id=${selectedFirmId}`);
        console.log('Bench response status:', benchResponse.status);
        
        if (benchResponse.ok) {
          const benchData = await benchResponse.json();
          console.log('Bench data received:', benchData);
          setBenchItems(benchData.items || []);
        } else {
          const errorData = await benchResponse.json();
          console.error('Bench API error:', errorData);
        }

        // Load pending invitations
        const invitesResponse = await fetch(`/api/firm-team/invite?firm_id=${selectedFirmId}&view=sent`);
        if (invitesResponse.ok) {
          const invitesData = await invitesResponse.json();
          const pending = invitesData.invitations?.filter((i: any) => i.status === 'pending') || [];
          setPendingInvites(pending);
        }
      } catch (error) {
        console.error('Error loading team data:', error);
      } finally {
        setIsLoadingBench(false);
      }
    };

    loadTeamData();
  }, [selectedFirmId]);

  const handleSendInvite = async () => {
    if (!selectedFirmId) return;

    // Reload pending invitations after sending
    try {
      const invitesResponse = await fetch(`/api/firm-team/invite?firm_id=${selectedFirmId}&view=sent`);
      if (invitesResponse.ok) {
        const invitesData = await invitesResponse.json();
        const pending = invitesData.invitations?.filter((i: any) => i.status === 'pending') || [];
        setPendingInvites(pending);
      }
    } catch (error) {
      console.error('Error reloading invitations:', error);
    }
  };

  const handleUpdateItem = async (itemId: string, updates: any) => {
    const response = await fetch(`/api/firm-team/${itemId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });

    if (response.ok) {
      const data = await response.json();
      setBenchItems((prev) =>
        prev.map((item) => (item.id === itemId ? { ...item, ...updates } : item))
      );
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    const response = await fetch(`/api/firm-team/${itemId}`, {
      method: 'DELETE',
    });

    if (response.ok) {
      setBenchItems((prev) => prev.filter((item) => item.id !== itemId));
    }
  };

  const handleMoveUp = (itemId: string) => {
    const index = benchItems.findIndex((item) => item.id === itemId);
    if (index <= 0) return;

    const newItems = [...benchItems];
    [newItems[index - 1], newItems[index]] = [newItems[index], newItems[index - 1]];
    setBenchItems(newItems);

    // Update priorities on backend
    updatePriorities(newItems);
  };

  const handleMoveDown = (itemId: string) => {
    const index = benchItems.findIndex((item) => item.id === itemId);
    if (index < 0 || index >= benchItems.length - 1) return;

    const newItems = [...benchItems];
    [newItems[index], newItems[index + 1]] = [newItems[index + 1], newItems[index]];
    setBenchItems(newItems);

    // Update priorities on backend
    updatePriorities(newItems);
  };

  const updatePriorities = async (items: any[]) => {
    const updates = items.map((item, index) => ({
      id: item.id,
      priority: 100 - index * 10,
    }));

    await fetch('/api/firm-team/reorder', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        firm_id: selectedFirmId,
        items: updates,
      }),
    });
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!userId) {
    return null;
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-red-600">{error}</div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-gray-600">Loading firms...</p>
        </div>
      </div>
    );
  }

  if (firms.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">No Firm Workspace Found</h1>
          <p className="text-gray-600 mb-6">
            Create a firm workspace to start building your trusted bench.
          </p>
          <button
            onClick={() => router.push('/firm')}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700"
          >
            Create Firm Workspace
          </button>
        </div>
      </div>
    );
  }

  const selectedFirm = firms.find((f) => f.id === selectedFirmId);
  
  // Check if selected firm has an active subscription
  const hasActiveSubscription = selectedFirm && 
    (selectedFirm.subscription_status === 'active' || selectedFirm.subscription_status === 'trialing');
  
  const subscriptionExpired = selectedFirm && 
    selectedFirm.subscription_status &&
    !['active', 'trialing'].includes(selectedFirm.subscription_status);

  return (
    <main className="min-h-screen bg-gray-50 py-8">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          {/* Checkout Status Messages */}
          {checkoutStatus === 'success' && (
            <div className="mb-6 rounded-lg bg-green-50 p-4 border border-green-200">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <h3 className="font-semibold text-green-900">Subscription activated!</h3>
                  <p className="text-sm text-green-800 mt-1">
                    Your firm workspace is now active. Start building your trusted bench of professionals.
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {checkoutStatus === 'canceled' && (
            <div className="mb-6 rounded-lg bg-yellow-50 p-4 border border-yellow-200">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <div>
                  <h3 className="font-semibold text-yellow-900">Checkout canceled</h3>
                  <p className="text-sm text-yellow-800 mt-1">
                    You can complete your subscription at any time to access your firm workspace features.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold text-gray-900">
              {selectedFirm ? `${selectedFirm.name} Extended Team` : 'Extended Team'}
            </h1>
            
            {/* Firm Selector (if multiple) */}
            {firms.length > 1 && (
              <select
                value={selectedFirmId}
                onChange={(e) => setSelectedFirmId(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {firms.map((firm) => (
                  <option key={firm.id} value={firm.id}>
                    {firm.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          {selectedFirm && (
            <div className="flex items-center justify-between">
              <p className="text-gray-600">
                Manage your trusted bench of professionals for <strong>{selectedFirm.name}</strong>
              </p>
              {hasActiveSubscription && (
                <button
                  onClick={() => setShowAddModal(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add from Directory
                </button>
              )}
            </div>
          )}
        </div>

        {/* Subscription Gate */}
        {!hasActiveSubscription && subscriptionExpired && (
          <div className="mb-8 rounded-2xl border-2 border-red-200 bg-red-50 p-8 text-center">
            <div className="mx-auto max-w-2xl">
              <svg className="mx-auto h-12 w-12 text-red-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <h3 className="text-2xl font-bold text-red-900 mb-2">Subscription Required</h3>
              <p className="text-red-800 mb-6">
                Your firm&rsquo;s subscription is {selectedFirm.subscription_status === 'canceled' ? 'canceled' : 'inactive'}. 
                Reactivate your subscription to access your team workspace and manage your bench.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  onClick={async () => {
                    try {
                      const response = await fetch('/api/stripe/create-checkout-session', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ firmId: selectedFirmId }),
                      });
                      
                      if (response.ok) {
                        const { url } = await response.json();
                        if (url) window.location.href = url;
                      }
                    } catch (error) {
                      console.error('Error creating checkout:', error);
                    }
                  }}
                  className="px-6 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700"
                >
                  Reactivate Subscription ($10/month)
                </button>
                {selectedFirm.stripe_customer_id && selectedFirm.user_role === 'admin' && (
                  <button
                    onClick={async () => {
                      try {
                        console.log('Opening billing portal for firm:', selectedFirmId);
                        const response = await fetch('/api/stripe/customer-portal', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ firmId: selectedFirmId }),
                        });
                        
                        console.log('Response status:', response.status);
                        const data = await response.json();
                        console.log('Response data:', data);
                        
                        if (response.ok) {
                          if (data.url) {
                            console.log('Redirecting to:', data.url);
                            window.location.href = data.url;
                          } else {
                            alert('No portal URL returned. Please contact support.');
                          }
                        } else {
                          alert(`Error: ${data.error || 'Failed to open billing portal'}`);
                        }
                      } catch (error) {
                        console.error('Error opening portal:', error);
                        alert(`Error opening billing portal: ${error instanceof Error ? error.message : 'Unknown error'}`);
                      }
                    }}
                    className="px-6 py-3 border border-red-600 text-red-600 rounded-lg font-semibold hover:bg-red-50"
                  >
                    Manage Billing
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {!hasActiveSubscription && !subscriptionExpired && selectedFirm && (
          <div className="mb-8 rounded-2xl border-2 border-blue-200 bg-blue-50 p-8 text-center">
            <div className="mx-auto max-w-2xl">
              <svg className="mx-auto h-12 w-12 text-blue-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <h3 className="text-2xl font-bold text-blue-900 mb-2">Activate Your Firm Workspace</h3>
              <p className="text-blue-800 mb-6">
                Complete your subscription to unlock your team workspace. Build your bench, invite professionals, and manage your extended team.
              </p>
              <div className="space-y-3 mb-6">
                <div className="flex items-center justify-center gap-2 text-blue-900">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span><strong>$10/month</strong> - Cancel anytime</span>
                </div>
                <div className="flex items-center justify-center gap-2 text-blue-900">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span><strong>No trial needed</strong> - Test the free platform first</span>
                </div>
              </div>
              <button
                onClick={async () => {
                  try {
                    const response = await fetch('/api/stripe/create-checkout-session', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ firmId: selectedFirmId }),
                    });
                    
                    if (response.ok) {
                      const { url } = await response.json();
                      if (url) window.location.href = url;
                    }
                  } catch (error) {
                    console.error('Error creating checkout:', error);
                  }
                }}
                className="px-8 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 text-lg"
              >
                Start Free Trial
              </button>
            </div>
          </div>
        )}

        {/* Billing Management Button (for admins with active subscription) */}
        {hasActiveSubscription && selectedFirm && selectedFirm.user_role === 'admin' && selectedFirm.stripe_customer_id && (
          <div className="mb-6 flex justify-end">
            <button
              onClick={async () => {
                try {
                  console.log('Opening billing portal for firm:', selectedFirmId);
                  const response = await fetch('/api/stripe/customer-portal', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ firmId: selectedFirmId }),
                  });
                  
                  console.log('Response status:', response.status);
                  const data = await response.json();
                  console.log('Response data:', data);
                  
                  if (response.ok) {
                    if (data.url) {
                      console.log('Redirecting to:', data.url);
                      window.location.href = data.url;
                    } else {
                      alert('No portal URL returned. Please contact support.');
                    }
                  } else {
                    alert(`Error: ${data.error || 'Failed to open billing portal'}`);
                  }
                } catch (error) {
                  console.error('Error opening portal:', error);
                  alert(`Error opening billing portal: ${error instanceof Error ? error.message : 'Unknown error'}`);
                }
              }}
              className="px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
              Manage Billing
            </button>
          </div>
        )}

        {/* Loading State */}
        {hasActiveSubscription && isLoadingBench && (
          <div className="text-center py-12">
            <div className="text-gray-600">Loading team members...</div>
          </div>
        )}

        {/* Pending Invitations */}
        {hasActiveSubscription && !isLoadingBench && pendingInvites.length > 0 && (
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">
              Pending Invitations ({pendingInvites.length})
            </h2>
            <div className="space-y-3">
              {pendingInvites.map((invite) => {
                const profile = invite.profiles;
                const avatarUrl = profile.image_url || profile.avatar_url;

                return (
                  <div key={invite.id} className="border border-yellow-300 bg-yellow-50 rounded-lg p-4">
                    <div className="flex items-start gap-4">
                      {/* Avatar */}
                      <div className="flex-shrink-0">
                        {avatarUrl ? (
                          <Image
                            src={avatarUrl}
                            alt={`${profile.first_name} ${profile.last_name}`}
                            className="w-12 h-12 rounded-full object-cover"
                            width={48}
                            height={48}
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-yellow-200 flex items-center justify-center text-yellow-700 font-semibold">
                            {profile.first_name[0]}{profile.last_name[0]}
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Link
                            href={`/p/${profile.slug}`}
                            className="font-semibold text-gray-900 hover:text-blue-600"
                          >
                            {profile.first_name} {profile.last_name}, {profile.credential_type}
                          </Link>
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-200 text-yellow-800">
                            ⏳ PENDING
                          </span>
                        </div>
                        
                        {profile.firm_name && (
                          <p className="text-sm text-gray-600">{profile.firm_name}</p>
                        )}
                        
                        {invite.custom_title_offer && (
                          <p className="text-sm text-blue-600 font-medium mt-1">
                            Invited as: {invite.custom_title_offer}
                          </p>
                        )}
                        
                        <p className="text-xs text-gray-500 mt-2">
                          Invited {new Date(invite.created_at).toLocaleDateString()} • 
                          Expires {new Date(invite.expires_at).toLocaleDateString()}
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="flex-shrink-0 flex gap-2">
                        <Link
                          href={`/messages?profile=${profile.id}`}
                          className="px-3 py-2 text-sm font-medium text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50"
                        >
                          Message
                        </Link>
                        <button
                          onClick={async () => {
                            if (confirm('Cancel this invitation? They will no longer be able to accept it.')) {
                              try {
                                const response = await fetch(`/api/firm-team/invite/${invite.id}`, {
                                  method: 'DELETE',
                                });
                                
                                if (response.ok) {
                                  setPendingInvites(prev => prev.filter(i => i.id !== invite.id));
                                } else {
                                  const data = await response.json();
                                  alert(data.error || 'Failed to cancel invitation');
                                }
                              } catch (error) {
                                console.error('Error cancelling invitation:', error);
                                alert('Failed to cancel invitation');
                              }
                            }
                          }}
                          className="px-3 py-2 text-sm font-medium text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Team Members Section - Organized by Category */}
        {hasActiveSubscription && !isLoadingBench && benchItems.length > 0 && (() => {
          // Group items by their first category (or "Uncategorized")
          const groupedItems = benchItems.reduce((acc, item) => {
            const category = item.categories && item.categories.length > 0 
              ? item.categories[0] 
              : 'Uncategorized';
            
            if (!acc[category]) {
              acc[category] = [];
            }
            acc[category].push(item);
            return acc;
          }, {} as Record<string, any[]>);

          // Sort categories: Uncategorized last, rest alphabetically
          const sortedCategories = Object.keys(groupedItems).sort((a, b) => {
            if (a === 'Uncategorized') return 1;
            if (b === 'Uncategorized') return -1;
            return a.localeCompare(b);
          });

          return (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-gray-900">
                Team Members ({benchItems.length})
              </h2>
              
              {sortedCategories.map((category) => {
                const items = groupedItems[category];
                
                return (
                  <div key={category} className="space-y-3">
                    {/* Category Header */}
                    <div className="flex items-center gap-3">
                      <h3 className="text-md font-semibold text-purple-900 bg-purple-100 px-3 py-1 rounded-lg">
                        {category}
                      </h3>
                      <div className="h-px flex-1 bg-purple-200"></div>
                      <span className="text-sm text-gray-500">
                        {items.length} {items.length === 1 ? 'member' : 'members'}
                      </span>
                    </div>

                    {/* Cards in this category */}
                    <div className="space-y-3 pl-4">
                      {items.map((item: any, index: number) => (
                        <BenchCard
                          key={item.id}
                          item={item}
                          onUpdate={handleUpdateItem}
                          onDelete={handleDeleteItem}
                          onMoveUp={handleMoveUp}
                          onMoveDown={handleMoveDown}
                          isFirst={index === 0}
                          isLast={index === items.length - 1}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })()}

        {/* Empty State */}
        {hasActiveSubscription && !isLoadingBench && benchItems.length === 0 && pendingInvites.length === 0 && (
          <div className="text-center py-16 bg-white rounded-lg border-2 border-dashed border-gray-300">
            <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No team members yet</h3>
            <p className="text-gray-600 mb-6">
              Start building your trusted bench by inviting verified professionals from our directory.
            </p>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700"
            >
              Invite Your First Professional
            </button>
          </div>
        )}

        {/* Public Preview Link */}
        {hasActiveSubscription && selectedFirm && selectedFirm.slug && benchItems.some((item) => item.visibility_public) && (
          <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-900">
              <strong>Public profile:</strong> View how your team appears publicly at{' '}
              <a
                href={`/f/${selectedFirm.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold underline hover:text-blue-700"
              >
                /f/{selectedFirm.slug}
              </a>
            </p>
          </div>
        )}
      </div>

      {/* Add Modal */}
      {hasActiveSubscription && showAddModal && selectedFirmId && (
        <AddFromDirectory
          key={selectedFirmId}
          firmId={selectedFirmId}
          onAdd={handleSendInvite}
          onClose={() => {
            setShowAddModal(false);
          }}
        />
      )}
    </main>
  );
}

export default function TeamDashboardPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-gray-50 py-8">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      </main>
    }>
      <TeamDashboardContent />
    </Suspense>
  );
}

