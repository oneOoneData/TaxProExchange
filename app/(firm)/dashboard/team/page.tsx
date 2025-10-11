/**
 * Firm Team Dashboard
 * 
 * Manage firm's trusted bench of professionals.
 * Gated by FEATURE_FIRM_WORKSPACES flag and membership.
 */

'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import { FEATURE_FIRM_WORKSPACES } from '@/lib/flags';
import BenchCard from '@/components/bench/BenchCard';
import AddFromDirectory from '@/components/bench/AddFromDirectory';

interface Firm {
  id: string;
  name: string;
  slug: string;
  user_role: string;
}

function TeamDashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isLoaded, userId } = useAuth();

  const [firms, setFirms] = useState<Firm[]>([]);
  const [selectedFirmId, setSelectedFirmId] = useState<string>('');
  const [benchItems, setBenchItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingBench, setIsLoadingBench] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Guard: redirect if flag is off (client-side only)
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

  // Load bench items when firm is selected
  useEffect(() => {
    if (!selectedFirmId) {
      setBenchItems([]);
      return;
    }

    const loadBench = async () => {
      setIsLoadingBench(true);
      try {
        const response = await fetch(`/api/firm-team?firm_id=${selectedFirmId}`);
        if (response.ok) {
          const data = await response.json();
          setBenchItems(data.items || []);
        }
      } catch (error) {
        console.error('Error loading bench:', error);
      } finally {
        setIsLoadingBench(false);
      }
    };

    loadBench();
  }, [selectedFirmId]);

  const handleAddProfile = async (profileId: string) => {
    if (!selectedFirmId) return;

    const response = await fetch('/api/firm-team', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        firm_id: selectedFirmId,
        trusted_profile_id: profileId,
      }),
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || 'Failed to add professional');
    }

    const data = await response.json();
    setBenchItems((prev) => [data.item, ...prev]);
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

  if (!isLoaded || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-red-600">{error}</div>
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
            onClick={() => router.push('/onboarding/firm')}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700"
          >
            Create Firm Workspace
          </button>
        </div>
      </div>
    );
  }

  const selectedFirm = firms.find((f) => f.id === selectedFirmId);

  return (
    <main className="min-h-screen bg-gray-50 py-8">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold text-gray-900">Our Team</h1>
            
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
              <button
                onClick={() => setShowAddModal(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add from Directory
              </button>
            </div>
          )}
        </div>

        {/* Loading State */}
        {isLoadingBench && (
          <div className="text-center py-12">
            <div className="text-gray-600">Loading team members...</div>
          </div>
        )}

        {/* Empty State */}
        {!isLoadingBench && benchItems.length === 0 && (
          <div className="text-center py-16 bg-white rounded-lg border-2 border-dashed border-gray-300">
            <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No team members yet</h3>
            <p className="text-gray-600 mb-6">
              Start building your trusted bench by adding verified professionals from our directory.
            </p>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700"
            >
              Add Your First Professional
            </button>
          </div>
        )}

        {/* Bench Items List */}
        {!isLoadingBench && benchItems.length > 0 && (
          <div className="space-y-3">
            {benchItems.map((item, index) => (
              <BenchCard
                key={item.id}
                item={item}
                onUpdate={handleUpdateItem}
                onDelete={handleDeleteItem}
                onMoveUp={handleMoveUp}
                onMoveDown={handleMoveDown}
                isFirst={index === 0}
                isLast={index === benchItems.length - 1}
              />
            ))}
          </div>
        )}

        {/* Public Preview Link */}
        {selectedFirm && selectedFirm.slug && benchItems.some((item) => item.visibility_public) && (
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
      {showAddModal && (
        <AddFromDirectory
          firmId={selectedFirmId}
          onAdd={handleAddProfile}
          onClose={() => setShowAddModal(false)}
        />
      )}
    </main>
  );
}

export default function TeamDashboardPage() {
  // Early return if feature is disabled (server-safe)
  if (!FEATURE_FIRM_WORKSPACES) {
    return null;
  }

  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Loading team dashboard...</div>
      </div>
    }>
      <TeamDashboardContent />
    </Suspense>
  );
}

