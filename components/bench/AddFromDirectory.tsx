/**
 * AddFromDirectory Component
 * 
 * Modal to search directory and add professionals to firm bench.
 * Uses existing /api/search endpoint.
 */

'use client';

import { useState, useEffect } from 'react';
import { useDebounce } from '@/lib/hooks/useDebounce';

interface Profile {
  id: string;
  first_name: string;
  last_name: string;
  credential_type: string;
  slug: string;
  firm_name?: string;
  avatar_url?: string;
  image_url?: string;
  headline?: string;
}

interface AddFromDirectoryProps {
  firmId: string;
  onAdd: (profileId: string) => Promise<void>;
  onClose: () => void;
}

export default function AddFromDirectory({ firmId, onAdd, onClose }: AddFromDirectoryProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Profile[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [addingId, setAddingId] = useState<string | null>(null);

  const debouncedQuery = useDebounce(query, 300);

  // Search effect
  useEffect(() => {
    if (!debouncedQuery || debouncedQuery.length < 2) {
      setResults([]);
      setIsSearching(false);
      return;
    }

    const searchProfiles = async () => {
      setIsSearching(true);
      try {
        const params = new URLSearchParams({
          q: debouncedQuery,
          limit: '20',
        });

        const response = await fetch(`/api/search?${params}`);
        if (response.ok) {
          const data = await response.json();
          setResults(data.profiles || []);
        }
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setIsSearching(false);
      }
    };

    searchProfiles();
  }, [debouncedQuery]);

  const handleAdd = async (profileId: string) => {
    setAddingId(profileId);
    try {
      await onAdd(profileId);
      // Remove from results
      setResults((prev) => prev.filter((p) => p.id !== profileId));
    } catch (error: any) {
      alert(error.message || 'Failed to add professional');
    } finally {
      setAddingId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black bg-opacity-30 transition-opacity"
          onClick={onClose}
        />

        {/* Modal */}
        <div className="relative w-full max-w-2xl bg-white rounded-lg shadow-xl">
          {/* Header */}
          <div className="border-b border-gray-200 p-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              Add from Directory
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Search Input */}
          <div className="p-4 border-b border-gray-200">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name, firm, credential, or specialization..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
          </div>

          {/* Results */}
          <div className="p-4 max-h-96 overflow-y-auto">
            {isSearching && (
              <div className="text-center text-gray-500 py-8">
                Searching...
              </div>
            )}

            {!isSearching && query && results.length === 0 && (
              <div className="text-center text-gray-500 py-8">
                No professionals found. Try a different search.
              </div>
            )}

            {!query && (
              <div className="text-center text-gray-500 py-8">
                Start typing to search for professionals to add to your team.
              </div>
            )}

            {results.length > 0 && (
              <div className="space-y-3">
                {results.map((profile) => {
                  const avatarUrl = profile.image_url || profile.avatar_url;
                  const isAdding = addingId === profile.id;

                  return (
                    <div
                      key={profile.id}
                      className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors"
                    >
                      {/* Avatar */}
                      {avatarUrl ? (
                        <img
                          src={avatarUrl}
                          alt={`${profile.first_name} ${profile.last_name}`}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold">
                          {profile.first_name[0]}{profile.last_name[0]}
                        </div>
                      )}

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900">
                          {profile.first_name} {profile.last_name}, {profile.credential_type}
                        </p>
                        {profile.firm_name && (
                          <p className="text-sm text-gray-600">{profile.firm_name}</p>
                        )}
                        {profile.headline && (
                          <p className="text-sm text-gray-500 truncate">{profile.headline}</p>
                        )}
                      </div>

                      {/* Add Button */}
                      <button
                        onClick={() => handleAdd(profile.id)}
                        disabled={isAdding}
                        className="px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 border border-blue-600 rounded-lg hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isAdding ? 'Adding...' : 'Add'}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 p-4 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

