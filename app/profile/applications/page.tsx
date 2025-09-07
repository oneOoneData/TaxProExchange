'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import Logo from '@/components/Logo';
import UserMenu from '@/components/UserMenu';

interface Application {
  id: string;
  cover_note: string;
  proposed_rate: number | null;
  proposed_payout_type: string | null;
  proposed_timeline: string | null;
  status: string;
  created_at: string;
  notes: string | null;
  job: {
    id: string;
    title: string;
    firm_name: string;
    payout_type: string;
    payout_fixed: number;
    payout_min: number;
    payout_max: number;
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

export default function ApplicationsPage() {
  const { user, isLoaded, isSignedIn } = useUser();
  const router = useRouter();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Redirect unauthenticated users
  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push('/');
    }
  }, [isLoaded, isSignedIn, router]);

  // Load user's applications
  useEffect(() => {
    const loadApplications = async () => {
      if (!isSignedIn || !user) return;

      try {
        setLoading(true);
        
        // Get user's profile ID first
        const profileResponse = await fetch(`/api/profile?clerk_id=${user.id}`);
        if (!profileResponse.ok) {
          throw new Error('Failed to load profile');
        }
        const profileData = await profileResponse.json();
        
        if (!profileData.id) {
          setError('Profile not found. Please complete your profile first.');
          return;
        }

        // Load applications for this profile
        const applicationsResponse = await fetch(`/api/profile/applications`);
        if (!applicationsResponse.ok) {
          throw new Error('Failed to load applications');
        }
        const applicationsData = await applicationsResponse.json();
        setApplications(applicationsData.applications || []);

      } catch (err) {
        console.error('Error loading applications:', err);
        setError(err instanceof Error ? err.message : 'Failed to load applications');
      } finally {
        setLoading(false);
      }
    };

    loadApplications();
  }, [isSignedIn, user]);

  const handleWithdraw = async (applicationId: string) => {
    try {
      const response = await fetch(`/api/profile/applications/${applicationId}/withdraw`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to withdraw application');
      }

      // Update local state
      setApplications(prev => prev.map(app => 
        app.id === applicationId 
          ? { ...app, status: 'withdrawn' }
          : app
      ));

    } catch (err) {
      console.error('Error withdrawing application:', err);
      alert('Failed to withdraw application. Please try again.');
    }
  };

  const filteredApplications = applications.filter(app => 
    statusFilter === 'all' || app.status === statusFilter
  );

  const statusCounts = applications.reduce((acc, app) => {
    acc[app.status] = (acc[app.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatJobPayout = (job: Application['job']) => {
    if (job.payout_type === 'fixed') {
      return `$${job.payout_fixed?.toLocaleString()}`;
    } else if (job.payout_type === 'hourly') {
      return `$${job.payout_min?.toLocaleString()}/hr - $${job.payout_max?.toLocaleString()}/hr`;
    } else if (job.payout_type === 'per_return') {
      return `$${job.payout_min?.toLocaleString()} - $${job.payout_max?.toLocaleString()} per return`;
    } else if (job.payout_type === 'discussed') {
      return 'To be discussed';
    }
    return 'Compensation not specified';
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading…</p>
      </div>
    );
  }

  if (!isSignedIn) return null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-slate-50">
      <header className="sticky top-0 z-30 backdrop-blur bg-white/70 border-b border-slate-200">
        <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
          <Logo />
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-600">My Applications</span>
            <button
              onClick={() => router.push('/jobs')}
              className="text-sm text-slate-600 hover:text-slate-900 cursor-pointer"
            >
              Browse Jobs
            </button>
            <UserMenu 
              userName={user?.fullName || undefined}
              userEmail={user?.primaryEmailAddress?.emailAddress}
            />
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            My Job Applications
          </h1>
          <p className="text-slate-600">
            Track the status of your job applications and manage your professional opportunities
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-8">
          <div className="bg-white p-4 rounded-lg border border-slate-200 text-center">
            <div className="text-2xl font-bold text-slate-900">{applications.length}</div>
            <div className="text-sm text-slate-600">Total</div>
          </div>
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 text-center">
            <div className="text-2xl font-bold text-blue-900">{statusCounts.applied || 0}</div>
            <div className="text-sm text-blue-600">Applied</div>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200 text-center">
            <div className="text-2xl font-bold text-yellow-900">{statusCounts.shortlisted || 0}</div>
            <div className="text-sm text-yellow-600">Shortlisted</div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg border border-green-200 text-center">
            <div className="text-2xl font-bold text-green-900">{statusCounts.hired || 0}</div>
            <div className="text-sm text-green-600">Hired</div>
          </div>
          <div className="bg-red-50 p-4 rounded-lg border border-red-200 text-center">
            <div className="text-2xl font-bold text-red-900">{statusCounts.rejected || 0}</div>
            <div className="text-sm text-red-600">Rejected</div>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg border border-purple-200 text-center">
            <div className="text-2xl font-bold text-purple-900">{statusCounts.completed || 0}</div>
            <div className="text-sm text-purple-600">Completed</div>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6">
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium text-slate-700">Filter by Status:</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border border-slate-300 rounded-md px-3 py-2 text-sm"
            >
              <option value="all">All Applications ({applications.length})</option>
              <option value="applied">Applied ({statusCounts.applied || 0})</option>
              <option value="shortlisted">Shortlisted ({statusCounts.shortlisted || 0})</option>
              <option value="hired">Hired ({statusCounts.hired || 0})</option>
              <option value="rejected">Rejected ({statusCounts.rejected || 0})</option>
              <option value="completed">Completed ({statusCounts.completed || 0})</option>
            </select>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
            <h3 className="text-lg font-semibold text-red-800 mb-2">Error</h3>
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {/* Applications */}
        {loading ? (
          <div className="text-center py-12">
            <p className="text-slate-600">Loading your applications...</p>
          </div>
        ) : filteredApplications.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-slate-600">
              {statusFilter === 'all' 
                ? 'You haven\'t applied to any jobs yet.'
                : `No applications with status "${statusFilter}".`
              }
            </p>
            {statusFilter === 'all' && (
              <button
                onClick={() => router.push('/jobs')}
                className="mt-4 px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Browse Available Jobs
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {filteredApplications.map((application) => (
              <div key={application.id} className="bg-white border border-gray-200 rounded-lg p-6">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {application.job.title}
                    </h3>
                    <p className="text-sm text-gray-600">{application.job.firm_name}</p>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 text-xs font-medium rounded-full border ${statusColors[application.status as keyof typeof statusColors]}`}>
                      {statusLabels[application.status as keyof typeof statusLabels]}
                    </span>
                    <span className="text-xs text-gray-500">
                      Applied {formatDate(application.created_at)}
                    </span>
                  </div>
                </div>

                {/* Job Details */}
                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Job Compensation</h4>
                    <p className="text-sm text-gray-600">{formatJobPayout(application.job)}</p>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Your Proposal</h4>
                    <div className="text-sm text-gray-600">
                      {application.proposed_rate ? (
                        <>
                          <p><span className="font-medium">Rate:</span> ${application.proposed_rate}</p>
                          {application.proposed_timeline && (
                            <p><span className="font-medium">Timeline:</span> {application.proposed_timeline}</p>
                          )}
                        </>
                      ) : (
                        <p className="text-gray-500">No rate specified</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Cover Note */}
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Your Cover Note</h4>
                  <p className="text-sm text-gray-600 italic bg-gray-50 p-3 rounded-md">
                    "{application.cover_note}"
                  </p>
                </div>

                {/* Notes from Employer */}
                {application.notes && (
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Notes from Employer</h4>
                    <p className="text-sm text-gray-600 bg-blue-50 p-3 rounded-md">
                      {application.notes}
                    </p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                  <div className="flex items-center gap-2">
                    <a
                      href={`/jobs/${application.job.id}`}
                      className="text-sm text-blue-600 hover:text-blue-800 underline"
                    >
                      View Job Details →
                    </a>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {application.status === 'applied' && (
                      <button
                        onClick={() => handleWithdraw(application.id)}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                      >
                        Withdraw Application
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
