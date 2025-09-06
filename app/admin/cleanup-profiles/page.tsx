'use client';

import { useState } from 'react';
import AdminRouteGuard from '@/components/AdminRouteGuard';

function CleanupProfilesContent() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const checkOrphanedProfiles = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/debug/cleanup-orphaned-profiles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      
      if (response.ok) {
        setResult(data);
      } else {
        setError(data.error || 'Failed to check profiles');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const deleteOrphanedProfiles = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/debug/cleanup-orphaned-profiles', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      
      if (response.ok) {
        setResult(data);
      } else {
        setError(data.error || 'Failed to delete profiles');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Cleanup Orphaned Profiles
        </h1>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Actions</h2>
          
          <div className="space-y-4">
            <button
              onClick={checkOrphanedProfiles}
              disabled={loading}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Checking...' : 'Check for Orphaned Profiles'}
            </button>

            <button
              onClick={deleteOrphanedProfiles}
              disabled={loading}
              className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 disabled:opacity-50 ml-4"
            >
              {loading ? 'Deleting...' : 'Delete Orphaned Profiles'}
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <h3 className="text-red-800 font-semibold">Error</h3>
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {result && (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-xl font-semibold mb-4">Results</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-gray-50 p-4 rounded">
                <div className="text-2xl font-bold text-gray-900">{result.totalProfiles}</div>
                <div className="text-gray-600">Total Profiles</div>
              </div>
              <div className="bg-blue-50 p-4 rounded">
                <div className="text-2xl font-bold text-blue-900">{result.activeProfiles}</div>
                <div className="text-blue-600">Active Profiles</div>
              </div>
              <div className="bg-red-50 p-4 rounded">
                <div className="text-2xl font-bold text-red-900">{result.orphanedCount}</div>
                <div className="text-red-600">Orphaned Profiles</div>
              </div>
            </div>

            {result.orphanedProfiles && result.orphanedProfiles.length > 0 && (
              <div>
                <h4 className="text-lg font-semibold mb-3">Orphaned Profiles</h4>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Name
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Email
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Clerk ID
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Created
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {result.orphanedProfiles.map((profile: any) => (
                        <tr key={profile.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {profile.name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {profile.email || 'No email'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {profile.clerk_id}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(profile.created_at).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {result.deletedProfiles && result.deletedProfiles.length > 0 && (
              <div className="mt-6">
                <h4 className="text-lg font-semibold mb-3 text-green-800">
                  Deleted Profiles ({result.deletedCount})
                </h4>
                <div className="space-y-2">
                  {result.deletedProfiles.map((profile: any) => (
                    <div key={profile.id} className="bg-green-50 p-3 rounded">
                      <div className="font-medium text-green-900">{profile.name}</div>
                      <div className="text-sm text-green-700">
                        {profile.email} • {profile.clerk_id}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function CleanupProfilesPage() {
  return (
    <AdminRouteGuard>
      <CleanupProfilesContent />
    </AdminRouteGuard>
  );
}
