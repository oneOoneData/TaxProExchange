'use client';

import { useState, useEffect, useCallback } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AdminRouteGuard from '@/components/AdminRouteGuard';

interface Application {
  id: string;
  cover_note: string;
  proposed_rate: number | null;
  proposed_payout_type: string | null;
  proposed_timeline: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  notes: string | null;
  job: {
    id: string;
    title: string;
    status: string;
    payout_type: string;
    payout_fixed: number;
    payout_min: number;
    payout_max: number;
    created_at: string;
    created_by: string;
  };
  applicant: {
    id: string;
    first_name: string;
    last_name: string;
    headline: string;
    slug: string;
    firm_name: string;
    public_email: string;
    phone: string;
    credential_type: string;
  };
}

const statusColors = {
  applied: 'bg-blue-100 text-blue-800 border-blue-200',
  shortlisted: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  hired: 'bg-green-100 text-green-800 border-green-200',
  rejected: 'bg-red-100 text-red-800 border-red-200',
  withdrawn: 'bg-gray-100 text-gray-800 border-gray-200',
  completed: 'bg-purple-100 text-purple-800 border-purple-200'
};

const statusLabels = {
  applied: 'Applied',
  shortlisted: 'Shortlisted',
  hired: 'Hired',
  rejected: 'Rejected',
  withdrawn: 'Withdrawn',
  completed: 'Completed'
};

export default function AdminJobApplicationsPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [total, setTotal] = useState(0);
  const [expandedApp, setExpandedApp] = useState<string | null>(null);
  const [notifying, setNotifying] = useState(false);
  const [testingEmail, setTestingEmail] = useState(false);

  const fetchApplications = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter !== 'all') {
        params.set('status', statusFilter);
      }
      
      const response = await fetch(`/api/admin/job-applications?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch applications');
      }
      
      const data = await response.json();
      setApplications(data.applications || []);
      setTotal(data.total || 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch applications');
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    if (isLoaded && !user) {
      router.push('/sign-in');
      return;
    }
    
    if (isLoaded && user) {
      fetchApplications();
    }
  }, [isLoaded, user, router, fetchApplications]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount: number | null) => {
    if (!amount) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const handleNotifyJobPosters = async () => {
    try {
      setNotifying(true);
      const response = await fetch('/api/notify-job-posters', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send notifications');
      }

      const result = await response.json();
      
      // Show success toast
      alert(`Notifications sent! ${result.notificationsSent} job posters notified.`);
      
    } catch (err) {
      console.error('Error sending notifications:', err);
      alert(`Error: ${err instanceof Error ? err.message : 'Failed to send notifications'}`);
    } finally {
      setNotifying(false);
    }
  };

  const handleTestEmail = async () => {
    try {
      setTestingEmail(true);
      const response = await fetch('/api/notify-job-posters/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send test email');
      }

      const result = await response.json();
      
      // Show success toast
      alert(`Test email sent successfully to ${result.recipient}!`);
      
    } catch (err) {
      console.error('Error sending test email:', err);
      alert(`Error: ${err instanceof Error ? err.message : 'Failed to send test email'}`);
    } finally {
      setTestingEmail(false);
    }
  };

  // Calculate stats
  const statusCounts = applications.reduce((acc, app) => {
    acc[app.status] = (acc[app.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

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
          {/* Header */}
          <div className="mb-8">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Job Applications</h1>
                <p className="mt-2 text-gray-600">View and manage all job applications across the platform</p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleTestEmail}
                  disabled={testingEmail}
                  className="bg-gray-600 hover:bg-gray-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200"
                >
                  {testingEmail ? 'Sending...' : 'Test Email'}
                </button>
                <button
                  onClick={handleNotifyJobPosters}
                  disabled={notifying}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200"
                >
                  {notifying ? 'Sending...' : 'Notify Job Posters'}
                </button>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-7 gap-4 mb-8">
            <div className="bg-white p-4 rounded-lg shadow border border-gray-200 text-center">
              <div className="text-2xl font-bold text-gray-900">{total}</div>
              <div className="text-sm text-gray-600">Total</div>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg shadow border border-blue-200 text-center">
              <div className="text-2xl font-bold text-blue-900">{statusCounts.applied || 0}</div>
              <div className="text-sm text-blue-600">Applied</div>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg shadow border border-yellow-200 text-center">
              <div className="text-2xl font-bold text-yellow-900">{statusCounts.shortlisted || 0}</div>
              <div className="text-sm text-yellow-600">Shortlisted</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg shadow border border-green-200 text-center">
              <div className="text-2xl font-bold text-green-900">{statusCounts.hired || 0}</div>
              <div className="text-sm text-green-600">Hired</div>
            </div>
            <div className="bg-red-50 p-4 rounded-lg shadow border border-red-200 text-center">
              <div className="text-2xl font-bold text-red-900">{statusCounts.rejected || 0}</div>
              <div className="text-sm text-red-600">Rejected</div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg shadow border border-gray-200 text-center">
              <div className="text-2xl font-bold text-gray-900">{statusCounts.withdrawn || 0}</div>
              <div className="text-sm text-gray-600">Withdrawn</div>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg shadow border border-purple-200 text-center">
              <div className="text-2xl font-bold text-purple-900">{statusCounts.completed || 0}</div>
              <div className="text-sm text-purple-600">Completed</div>
            </div>
          </div>

          {/* Filters */}
          <div className="mb-6 bg-white p-4 rounded-lg shadow border border-gray-200">
            <div className="flex items-center gap-4">
              <label className="text-sm font-medium text-gray-700">Filter by Status:</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Applications ({total})</option>
                <option value="applied">Applied ({statusCounts.applied || 0})</option>
                <option value="shortlisted">Shortlisted ({statusCounts.shortlisted || 0})</option>
                <option value="hired">Hired ({statusCounts.hired || 0})</option>
                <option value="rejected">Rejected ({statusCounts.rejected || 0})</option>
                <option value="withdrawn">Withdrawn ({statusCounts.withdrawn || 0})</option>
                <option value="completed">Completed ({statusCounts.completed || 0})</option>
              </select>
            </div>
          </div>

          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 rounded-md p-4">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Applications List */}
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-2 text-gray-600">Loading applications...</p>
            </div>
          ) : applications.length === 0 ? (
            <div className="bg-white shadow rounded-lg p-8 text-center">
              <p className="text-gray-500">
                {statusFilter === 'all' 
                  ? 'No applications found'
                  : `No applications with status "${statusFilter}"`
                }
              </p>
            </div>
          ) : (
            <div className="bg-white shadow overflow-hidden rounded-lg">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Applicant
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Job
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Proposed Rate
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Applied Date
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {applications.map((app) => (
                      <>
                        <tr key={app.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div>
                                <Link 
                                  href={`/p/${app.applicant.slug}`}
                                  className="text-sm font-medium text-blue-600 hover:text-blue-800"
                                  target="_blank"
                                >
                                  {app.applicant.first_name} {app.applicant.last_name}
                                </Link>
                                <div className="text-sm text-gray-500">
                                  {app.applicant.credential_type || 'N/A'}
                                </div>
                                {app.applicant.firm_name && (
                                  <div className="text-xs text-gray-400">{app.applicant.firm_name}</div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-900">{app.job.title}</div>
                            <div className="text-xs text-gray-500">
                              Job Status: {app.job.status}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              statusColors[app.status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800'
                            }`}>
                              {statusLabels[app.status as keyof typeof statusLabels] || app.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {app.proposed_rate ? (
                              <>
                                {formatCurrency(app.proposed_rate)}
                                {app.proposed_payout_type && (
                                  <div className="text-xs text-gray-500">
                                    {app.proposed_payout_type}
                                  </div>
                                )}
                              </>
                            ) : (
                              <span className="text-gray-400">No rate</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(app.created_at)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button
                              onClick={() => setExpandedApp(expandedApp === app.id ? null : app.id)}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              {expandedApp === app.id ? 'Hide' : 'View'} Details
                            </button>
                          </td>
                        </tr>
                        {expandedApp === app.id && (
                          <tr>
                            <td colSpan={6} className="px-6 py-4 bg-gray-50">
                              <div className="space-y-4">
                                {/* Cover Note */}
                                {app.cover_note && (
                                  <div>
                                    <h4 className="text-sm font-semibold text-gray-900 mb-1">Cover Note:</h4>
                                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{app.cover_note}</p>
                                  </div>
                                )}

                                {/* Timeline */}
                                {app.proposed_timeline && (
                                  <div>
                                    <h4 className="text-sm font-semibold text-gray-900 mb-1">Proposed Timeline:</h4>
                                    <p className="text-sm text-gray-700">{app.proposed_timeline}</p>
                                  </div>
                                )}

                                {/* Internal Notes */}
                                {app.notes && (
                                  <div>
                                    <h4 className="text-sm font-semibold text-gray-900 mb-1">Internal Notes:</h4>
                                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{app.notes}</p>
                                  </div>
                                )}

                                {/* Contact Info */}
                                <div>
                                  <h4 className="text-sm font-semibold text-gray-900 mb-2">Contact Information:</h4>
                                  <div className="grid grid-cols-2 gap-3 text-sm">
                                    {app.applicant.public_email && (
                                      <div>
                                        <span className="text-gray-500">Email:</span>{' '}
                                        <a href={`mailto:${app.applicant.public_email}`} className="text-blue-600 hover:text-blue-800">
                                          {app.applicant.public_email}
                                        </a>
                                      </div>
                                    )}
                                    {app.applicant.phone && (
                                      <div>
                                        <span className="text-gray-500">Phone:</span>{' '}
                                        <a href={`tel:${app.applicant.phone}`} className="text-blue-600 hover:text-blue-800">
                                          {app.applicant.phone}
                                        </a>
                                      </div>
                                    )}
                                  </div>
                                </div>

                                {/* Job Details */}
                                <div>
                                  <h4 className="text-sm font-semibold text-gray-900 mb-2">Job Details:</h4>
                                  <div className="grid grid-cols-2 gap-3 text-sm">
                                    <div>
                                      <span className="text-gray-500">Job ID:</span>{' '}
                                      <Link 
                                        href={`/jobs/${app.job.id}`} 
                                        className="text-blue-600 hover:text-blue-800"
                                        target="_blank"
                                      >
                                        {app.job.id.substring(0, 8)}...
                                      </Link>
                                    </div>
                                    <div>
                                      <span className="text-gray-500">Created By:</span> {app.job.created_by}
                                    </div>
                                    {app.job.payout_type && (
                                      <div>
                                        <span className="text-gray-500">Job Budget:</span>{' '}
                                        {app.job.payout_type === 'fixed' && formatCurrency(app.job.payout_fixed)}
                                        {app.job.payout_type === 'range' && `${formatCurrency(app.job.payout_min)} - ${formatCurrency(app.job.payout_max)}`}
                                      </div>
                                    )}
                                  </div>
                                </div>

                                {/* Metadata */}
                                <div className="border-t border-gray-200 pt-3">
                                  <div className="grid grid-cols-3 gap-3 text-xs text-gray-500">
                                    <div>
                                      <span className="font-medium">Application ID:</span> {app.id.substring(0, 8)}...
                                    </div>
                                    <div>
                                      <span className="font-medium">Created:</span> {formatDate(app.created_at)}
                                    </div>
                                    <div>
                                      <span className="font-medium">Updated:</span> {formatDate(app.updated_at)}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminRouteGuard>
  );
}

