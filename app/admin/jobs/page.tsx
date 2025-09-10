'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import AdminRouteGuard from '@/components/AdminRouteGuard';

interface Job {
  id: string;
  title: string;
  description: string;
  status: string;
  created_at: string;
  created_by: string;
  firm: {
    name: string;
    verified: boolean;
  };
  admin_info?: {
    can_edit: boolean;
    can_delete: boolean;
    created_by: string;
    original_status: string;
  };
}

export default function AdminJobsPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingJob, setEditingJob] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Job>>({});

  useEffect(() => {
    if (isLoaded && !user) {
      router.push('/sign-in');
      return;
    }
    
    if (isLoaded && user) {
      fetchJobs();
    }
  }, [isLoaded, user, router]);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/jobs?admin=true');
      
      if (!response.ok) {
        throw new Error('Failed to fetch jobs');
      }
      
      const data = await response.json();
      setJobs(data.jobs || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch jobs');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (job: Job) => {
    setEditingJob(job.id);
    setEditForm({
      title: job.title,
      description: job.description,
      status: job.status
    });
  };

  const handleSave = async (jobId: string) => {
    try {
      const response = await fetch(`/api/jobs/${jobId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editForm),
      });

      if (!response.ok) {
        throw new Error('Failed to update job');
      }

      // Refresh jobs list
      await fetchJobs();
      setEditingJob(null);
      setEditForm({});
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update job');
    }
  };

  const handleDelete = async (jobId: string, forceDelete = false) => {
    if (!confirm(`Are you sure you want to ${forceDelete ? 'permanently delete' : 'cancel'} this job?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/jobs/${jobId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ forceDelete, newStatus: 'cancelled' }),
      });

      if (!response.ok) {
        throw new Error('Failed to delete job');
      }

      // Refresh jobs list
      await fetchJobs();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete job');
    }
  };

  const handleStatusChange = async (jobId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/jobs/${jobId}`, {
        method: 'DELETE', // Using DELETE endpoint for status changes
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ newStatus }),
      });

      if (!response.ok) {
        throw new Error('Failed to update job status');
      }

      // Refresh jobs list
      await fetchJobs();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update job status');
    }
  };

  if (!isLoaded) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!user) {
    return null;
  }

  return (
    <AdminRouteGuard>
      <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Jobs Management</h1>
          <p className="mt-2 text-gray-600">Manage all jobs on the platform</p>
        </div>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-md p-4">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {loading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600">Loading jobs...</p>
          </div>
        ) : (
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <ul className="divide-y divide-gray-200">
              {jobs.map((job) => (
                <li key={job.id} className="px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-medium text-gray-900 truncate">
                            {editingJob === job.id ? (
                              <input
                                type="text"
                                value={editForm.title || ''}
                                onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                                className="w-full border border-gray-300 rounded-md px-3 py-2"
                              />
                            ) : (
                              job.title
                            )}
                          </h3>
                          <p className="text-sm text-gray-500">
                            Firm: {job.firm.name} {!job.firm.verified && '(Unverified)'}
                          </p>
                          <p className="text-sm text-gray-500">
                            Status: {job.status} | Created: {new Date(job.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            job.status === 'open' ? 'bg-green-100 text-green-800' :
                            job.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {job.status}
                          </span>
                        </div>
                      </div>
                      
                      {editingJob === job.id ? (
                        <div className="mt-3">
                          <textarea
                            value={editForm.description || ''}
                            onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                            rows={3}
                            className="w-full border border-gray-300 rounded-md px-3 py-2"
                            placeholder="Job description"
                          />
                          <div className="mt-2 flex items-center space-x-2">
                            <select
                              value={editForm.status || job.status}
                              onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                              className="border border-gray-300 rounded-md px-3 py-2 text-sm"
                            >
                              <option value="open">Open</option>
                              <option value="closed">Closed</option>
                              <option value="cancelled">Cancelled</option>
                              <option value="archived">Archived</option>
                            </select>
                            <button
                              onClick={() => handleSave(job.id)}
                              className="bg-blue-600 text-white px-3 py-2 rounded-md text-sm hover:bg-blue-700"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => {
                                setEditingJob(null);
                                setEditForm({});
                              }}
                              className="bg-gray-600 text-white px-3 py-2 rounded-md text-sm hover:bg-gray-700"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <p className="mt-2 text-sm text-gray-600 line-clamp-2">
                          {job.description}
                        </p>
                      )}
                    </div>
                    
                    {editingJob !== job.id && (
                      <div className="flex items-center space-x-2 ml-4">
                        <button
                          onClick={() => handleEdit(job)}
                          className="bg-blue-600 text-white px-3 py-2 rounded-md text-sm hover:bg-blue-700"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleStatusChange(job.id, 'cancelled')}
                          className="bg-yellow-600 text-white px-3 py-2 rounded-md text-sm hover:bg-yellow-700"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleDelete(job.id, true)}
                          className="bg-red-600 text-white px-3 py-2 rounded-md text-sm hover:bg-red-700"
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                </li>
              ))}
            </ul>
            
            {jobs.length === 0 && (
              <div className="text-center py-8">
                <p className="text-gray-500">No jobs found</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
    </AdminRouteGuard>
  );
}
