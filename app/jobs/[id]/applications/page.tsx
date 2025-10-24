'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter, useParams } from 'next/navigation';
import { ApplicationCard } from '@/components/jobs/ApplicationCard';
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
  applicant: {
    name: string;
    headline: string;
    credential_type: string;
    slug: string;
  };
}

interface Job {
  id: string;
  title: string;
  firm_name: string;
  created_by: string;
}

export default function JobApplicationsPage() {
  const { user, isLoaded, isSignedIn } = useUser();
  const params = useParams();
  const router = useRouter();
  const [applications, setApplications] = useState<Application[]>([]);
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [connectionStates, setConnectionStates] = useState<Record<string, {
    status: 'pending' | 'accepted' | 'declined';
    connectionId?: string;
    isRequester?: boolean;
  }>>({});

  // Redirect unauthenticated users
  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push('/');
    }
  }, [isLoaded, isSignedIn, router]);

  // Load job and applications
  useEffect(() => {
    const loadData = async () => {
      if (!isSignedIn || !user || !params.id) return;

      try {
        setLoading(true);
        
        // Load job details
        const jobResponse = await fetch(`/api/jobs/${params.id}`);
        if (!jobResponse.ok) {
          throw new Error('Failed to load job');
        }
        const jobData = await jobResponse.json();
        setJob(jobData);

        // Verify user owns this job using clerk_id-based lookup
        const ownershipResponse = await fetch(`/api/jobs/${params.id}/check-ownership`);
        if (!ownershipResponse.ok) {
          setError('You can only view applications for jobs you created');
          return;
        }

        const ownershipData = await ownershipResponse.json();
        if (!ownershipData.isOwner) {
          setError('You can only view applications for jobs you created');
          return;
        }

        // Load applications for this specific job
        const applicationsResponse = await fetch(`/api/profile/applications-received`);
        if (!applicationsResponse.ok) {
          throw new Error('Failed to load applications');
        }
        const applicationsData = await applicationsResponse.json();
        // Filter applications to only show those for this specific job
        const jobApplications = applicationsData.applications?.filter((app: any) => app.job?.id === params.id) || [];
        setApplications(jobApplications);

      } catch (err) {
        console.error('Error loading data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [params.id, isSignedIn, user]);

  const handleStatusUpdate = async (applicationId: string, newStatus: string, notes?: string) => {
    if (!params.id) return;
    
    try {
      const response = await fetch(`/api/jobs/${params.id}/applications/${applicationId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus, notes }),
      });

      if (!response.ok) {
        throw new Error('Failed to update application status');
      }

      // Update local state
      setApplications(prev => prev.map(app => 
        app.id === applicationId 
          ? { ...app, status: newStatus, notes: notes || null }
          : app
      ));

    } catch (err) {
      console.error('Error updating status:', err);
      throw err;
    }
  };

  const checkConnectionStatus = async (profileSlug: string) => {
    try {
      const response = await fetch(`/api/connections/check?profileSlug=${profileSlug}`);
      if (response.ok) {
        const data = await response.json();
        setConnectionStates(prev => ({
          ...prev,
          [profileSlug]: {
            status: data.status,
            connectionId: data.connectionId,
            isRequester: data.isRequester
          }
        }));
      }
    } catch (error) {
      console.error('Error checking connection status:', error);
    }
  };

  const handleConnect = async (profileSlug: string) => {
    try {
      const response = await fetch('/api/connections/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profileSlug })
      });

      if (response.ok) {
        await checkConnectionStatus(profileSlug);
      } else {
        const error = await response.json();
        console.error('Connection failed:', error);
        alert('Failed to send connection request. Please try again.');
      }
    } catch (error) {
      console.error('Connection error:', error);
      alert('Failed to send connection request. Please try again.');
    }
  };

  // Check connection status for all applicants when applications load
  useEffect(() => {
    if (applications.length > 0) {
      applications.forEach(app => {
        if (app.applicant.slug) {
          checkConnectionStatus(app.applicant.slug);
        }
      });
    }
  }, [applications]);

  const filteredApplications = applications.filter(app => 
    statusFilter === 'all' || app.status === statusFilter
  );

  const statusCounts = applications.reduce((acc, app) => {
    acc[app.status] = (acc[app.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading…</p>
      </div>
    );
  }

  if (!isSignedIn) return null;

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-slate-50">
        <header className="sticky top-0 z-30 backdrop-blur bg-white/70 border-b border-slate-200">
          <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
            <Logo />
            <UserMenu 
              userName={user?.fullName || undefined}
              userEmail={user?.primaryEmailAddress?.emailAddress}
            />
          </div>
        </header>

        <div className="mx-auto max-w-4xl px-4 py-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <h1 className="text-xl font-semibold text-red-800 mb-2">Access Denied</h1>
            <p className="text-red-600">{error}</p>
            <button
              onClick={() => router.push('/jobs')}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
            >
              Back to Jobs
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-slate-50">
      <header className="sticky top-0 z-30 backdrop-blur bg-white/70 border-b border-slate-200">
        <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
          <Logo />
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-600">Job Applications</span>
            <button
              onClick={() => router.push('/jobs')}
              className="text-sm text-slate-600 hover:text-slate-900 cursor-pointer"
            >
              Back to Jobs
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
            Applications for {job?.title}
          </h1>
          <p className="text-slate-600">
            Manage applications for your job posting at {job?.firm_name}
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

        {/* Applications */}
        {loading ? (
          <div className="text-center py-12">
            <p className="text-slate-600">Loading applications...</p>
          </div>
        ) : filteredApplications.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-slate-600">
              {statusFilter === 'all' 
                ? 'No applications received yet for this job.'
                : `No applications with status "${statusFilter}".`
              }
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredApplications.map((application) => (
              <ApplicationCard
                key={application.id}
                application={application}
                onStatusUpdate={handleStatusUpdate}
                connectionState={connectionStates[application.applicant.slug]}
                onConnect={handleConnect}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
