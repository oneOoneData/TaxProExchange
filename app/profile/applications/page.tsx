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

interface ReceivedApplication {
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
    payout_type: string;
    payout_fixed: number;
    payout_min: number;
    payout_max: number;
    created_at: string;
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

export default function ApplicationsPage() {
  const { user, isLoaded, isSignedIn } = useUser();
  const router = useRouter();
  const [applications, setApplications] = useState<Application[]>([]);
  const [receivedApplications, setReceivedApplications] = useState<ReceivedApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [receivedLoading, setReceivedLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'sent' | 'received'>('sent');

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

  // Load received applications
  useEffect(() => {
    const loadReceivedApplications = async () => {
      if (!isSignedIn || !user) return;

      try {
        setReceivedLoading(true);
        
        const response = await fetch(`/api/profile/applications-received`);
        if (!response.ok) {
          throw new Error('Failed to load received applications');
        }
        const data = await response.json();
        console.log('Received applications data:', data.applications);
        setReceivedApplications(data.applications || []);

      } catch (err) {
        console.error('Error loading received applications:', err);
        // Don't set error for received applications, just log it
      } finally {
        setReceivedLoading(false);
      }
    };

    loadReceivedApplications();
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

  const handleUpdateApplicationStatus = async (applicationId: string, status: string, notes?: string) => {
    try {
      // Find the application to get details for email notification
      const application = receivedApplications.find(app => app.id === applicationId);
      if (!application) {
        throw new Error('Application not found');
      }

      const response = await fetch(`/api/profile/applications/${applicationId}/update-status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status, notes }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update application status');
      }

      // Update local state for received applications
      setReceivedApplications(prev => prev.map(app => 
        app.id === applicationId 
          ? { ...app, status, notes: notes || app.notes }
          : app
      ));

      // Send email notification to applicant
      try {
        await fetch('/api/notifications/application-status-updated', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            applicationId,
            newStatus: status,
            jobTitle: application.job?.title || 'the position',
            applicantEmail: (application as ReceivedApplication).applicant?.public_email,
            applicantName: `${(application as ReceivedApplication).applicant?.first_name} ${(application as ReceivedApplication).applicant?.last_name}`
          }),
        });
      } catch (emailError) {
        console.error('Error sending email notification:', emailError);
        // Don't fail the main operation if email fails
      }

      // Show success message
      const statusLabels = {
        shortlisted: 'shortlisted',
        hired: 'hired',
        rejected: 'rejected'
      };
      alert(`Application ${statusLabels[status as keyof typeof statusLabels] || status} successfully! Email notification sent to applicant.`);

    } catch (err) {
      console.error('Error updating application status:', err);
      alert(`Failed to update application status. ${err instanceof Error ? err.message : 'Please try again.'}`);
    }
  };

  const handleStartMessaging = async (applicant: ReceivedApplication['applicant']) => {
    try {
      // First, create a connection with the applicant
      const response = await fetch('/api/connections/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recipientProfileId: applicant.id,
          status: 'accepted' // Auto-accept since job poster is initiating
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create connection');
      }

      const { connection } = await response.json();
      
      // Navigate to the messages page with the new connection
      router.push(`/messages/${connection.id}`);
      
    } catch (err) {
      console.error('Error starting conversation:', err);
      alert(`Failed to start conversation. ${err instanceof Error ? err.message : 'Please try again.'}`);
    }
  };

  const currentApplications = activeTab === 'sent' ? applications : receivedApplications;
  const currentLoading = activeTab === 'sent' ? loading : receivedLoading;

  const filteredApplications = currentApplications.filter(app => {
    // Temporarily show all applications to debug the issue
    console.log('Application being filtered:', {
      id: app.id,
      hasJob: !!app.job,
      jobTitle: app.job?.title,
      status: app.status,
      statusFilter
    });
    
    // TEMPORARILY DISABLE NULL JOB FILTERING TO DEBUG
    // if (!app.job) {
    //   console.log('Filtering out application with null job:', app);
    //   return false;
    // }
    return statusFilter === 'all' || app.status === statusFilter;
  });

  // Debug logging
  console.log('Current applications:', currentApplications.length);
  console.log('Filtered applications:', filteredApplications.length);
  console.log('Active tab:', activeTab);

  const statusCounts = currentApplications.reduce((acc, app) => {
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
            {activeTab === 'sent' ? 'Job Applications' : 'Job Applications Command Center'}
          </h1>
          <p className="text-slate-600">
            {activeTab === 'sent' 
              ? 'Track your job applications and manage applications for your posted jobs'
              : 'Manage applications for your posted jobs, review candidates, and start conversations'
            }
          </p>
        </div>

        {/* Tabs */}
        <div className="mb-8">
          <div className="border-b border-slate-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('sent')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'sent'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                }`}
              >
                My Applications ({applications.length})
              </button>
              <button
                onClick={() => setActiveTab('received')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'received'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                }`}
              >
                Applications Received ({receivedApplications.length})
              </button>
            </nav>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-8">
          <div className="bg-white p-4 rounded-lg border border-slate-200 text-center">
            <div className="text-2xl font-bold text-slate-900">{currentApplications.length}</div>
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

        {/* Command Center Quick Actions */}
        {activeTab === 'received' && receivedApplications.length > 0 && (
          <div className="mb-8 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">🚀 Quick Actions</h3>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-900">{statusCounts.applied || 0}</div>
                <div className="text-sm text-blue-600 mb-2">New Applications</div>
                <div className="text-xs text-gray-500">Review and take action</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-900">{statusCounts.shortlisted || 0}</div>
                <div className="text-sm text-yellow-600 mb-2">Shortlisted</div>
                <div className="text-xs text-gray-500">Ready for interviews</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-900">{statusCounts.hired || 0}</div>
                <div className="text-sm text-green-600 mb-2">Hired</div>
                <div className="text-xs text-gray-500">Successfully placed</div>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="mb-6">
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium text-slate-700">Filter by Status:</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border border-slate-300 rounded-md px-3 py-2 text-sm"
            >
              <option value="all">All Applications ({currentApplications.length})</option>
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
        {currentLoading ? (
          <div className="text-center py-12">
            <p className="text-slate-600">
              {activeTab === 'sent' ? 'Loading your applications...' : 'Loading received applications...'}
            </p>
          </div>
        ) : filteredApplications.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-slate-600">
              {statusFilter === 'all' 
                ? (activeTab === 'sent' 
                    ? 'You haven\'t applied to any jobs yet.'
                    : 'No one has applied to your jobs yet.')
                : `No applications with status "${statusFilter}".`
              }
            </p>
            {statusFilter === 'all' && activeTab === 'sent' && (
              <button
                onClick={() => router.push('/jobs')}
                className="mt-4 px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Browse Available Jobs
              </button>
            )}
            {statusFilter === 'all' && activeTab === 'received' && (
              <button
                onClick={() => router.push('/jobs/new')}
                className="mt-4 px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Post a Job
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
                      {application.job?.title || 'Job Not Found (Debug Mode)'}
                    </h3>
                    {activeTab === 'sent' ? (
                      <p className="text-sm text-gray-600">{application.job?.firm_name || 'Unknown Company'}</p>
                    ) : (
                      <p className="text-sm text-gray-600">
                        Applied by: {(application as ReceivedApplication).applicant?.first_name || 'Unknown'} {(application as ReceivedApplication).applicant?.last_name || 'User'}
                        {(application as ReceivedApplication).applicant?.firm_name && ` (${(application as ReceivedApplication).applicant.firm_name})`}
                      </p>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 text-xs font-medium rounded-full border ${statusColors[application.status as keyof typeof statusColors]}`}>
                      {statusLabels[application.status as keyof typeof statusLabels]}
                    </span>
                    <span className="text-xs text-gray-500">
                      {activeTab === 'sent' ? 'Applied' : 'Received'} {formatDate(application.created_at)}
                    </span>
                  </div>
                </div>

                {/* Job Details */}
                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Job Compensation</h4>
                    <p className="text-sm text-gray-600">
                      {application.job ? formatJobPayout(application.job) : 'Job details not available'}
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">
                      {activeTab === 'sent' ? 'Your Proposal' : 'Applicant\'s Proposal'}
                    </h4>
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

                {/* Applicant Details for Received Applications */}
                {activeTab === 'received' && (
                  <div className="mb-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                    <div className="flex items-start justify-between mb-3">
                      <h4 className="text-sm font-medium text-gray-700">Applicant Information</h4>
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {(application as ReceivedApplication).applicant.credential_type}
                        </span>
                      </div>
                    </div>
                    <div className="grid md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="font-medium text-gray-900">{(application as ReceivedApplication).applicant.first_name} {(application as ReceivedApplication).applicant.last_name}</p>
                        {(application as ReceivedApplication).applicant.headline && (
                          <p className="text-gray-600 italic">{(application as ReceivedApplication).applicant.headline}</p>
                        )}
                        {(application as ReceivedApplication).applicant.firm_name && (
                          <p className="text-gray-500">{(application as ReceivedApplication).applicant.firm_name}</p>
                        )}
                      </div>
                      <div className="space-y-1">
                        {(application as ReceivedApplication).applicant.public_email && (
                          <p><span className="font-medium text-gray-600">Email:</span> <a href={`mailto:${(application as ReceivedApplication).applicant.public_email}`} className="text-blue-600 hover:text-blue-800">{(application as ReceivedApplication).applicant.public_email}</a></p>
                        )}
                        {(application as ReceivedApplication).applicant.phone && (
                          <p><span className="font-medium text-gray-600">Phone:</span> <a href={`tel:${(application as ReceivedApplication).applicant.phone}`} className="text-blue-600 hover:text-blue-800">{(application as ReceivedApplication).applicant.phone}</a></p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Cover Note */}
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">
                    {activeTab === 'sent' ? 'Your Cover Note' : 'Applicant\'s Cover Note'}
                  </h4>
                  <p className="text-sm text-gray-600 italic bg-gray-50 p-3 rounded-md">
                    "{application.cover_note}"
                  </p>
                </div>

                {/* Notes from Employer */}
                {application.notes && (
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">
                      {activeTab === 'sent' ? 'Notes from Employer' : 'Your Notes'}
                    </h4>
                    <p className="text-sm text-gray-600 bg-blue-50 p-3 rounded-md">
                      {application.notes}
                    </p>
                  </div>
                )}

                {/* Add Notes Section for Received Applications */}
                {activeTab === 'received' && (
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Add Private Notes</h4>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Add notes about this applicant..."
                        className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            const notes = (e.target as HTMLInputElement).value;
                            if (notes.trim()) {
                              handleUpdateApplicationStatus(application.id, application.status, notes);
                              (e.target as HTMLInputElement).value = '';
                            }
                          }
                        }}
                      />
                      <button
                        onClick={(e) => {
                          const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                          const notes = input.value;
                          if (notes.trim()) {
                            handleUpdateApplicationStatus(application.id, application.status, notes);
                            input.value = '';
                          }
                        }}
                        className="px-4 py-2 text-sm font-medium text-blue-700 bg-blue-50 border border-blue-300 rounded-md hover:bg-blue-100 transition-colors"
                      >
                        Save Note
                      </button>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                  <div className="flex items-center gap-2">
                    {application.job && (
                      <a
                        href={`/jobs/${application.job.id}`}
                        className="text-sm text-blue-600 hover:text-blue-800 underline"
                      >
                        📋 View Job Details
                      </a>
                    )}
                    {activeTab === 'received' && (application as ReceivedApplication).applicant && (
                      <div className="flex items-center gap-3">
                        <a
                          href={`/p/${(application as ReceivedApplication).applicant.slug || (application as ReceivedApplication).applicant.id}`}
                          className="text-sm text-blue-600 hover:text-blue-800 underline"
                        >
                          👤 View Profile
                        </a>
                        <button
                          onClick={() => handleStartMessaging((application as ReceivedApplication).applicant)}
                          className="text-sm text-green-600 hover:text-green-800 underline font-medium"
                        >
                          💬 Message
                        </button>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {activeTab === 'sent' && application.status === 'applied' && (
                      <button
                        onClick={() => handleWithdraw(application.id)}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                      >
                        Withdraw Application
                      </button>
                    )}
                    {activeTab === 'received' && (
                      <div className="flex flex-wrap gap-2">
                        {application.status === 'applied' && (
                          <>
                            <button
                              onClick={() => handleUpdateApplicationStatus(application.id, 'shortlisted')}
                              className="px-4 py-2 text-sm font-medium text-yellow-700 bg-yellow-50 border border-yellow-300 rounded-md hover:bg-yellow-100 transition-colors"
                            >
                              ⭐ Shortlist
                            </button>
                            <button
                              onClick={() => handleUpdateApplicationStatus(application.id, 'hired')}
                              className="px-4 py-2 text-sm font-medium text-green-700 bg-green-50 border border-green-300 rounded-md hover:bg-green-100 transition-colors"
                            >
                              ✅ Hire
                            </button>
                            <button
                              onClick={() => handleUpdateApplicationStatus(application.id, 'rejected')}
                              className="px-4 py-2 text-sm font-medium text-red-700 bg-red-50 border border-red-300 rounded-md hover:bg-red-100 transition-colors"
                            >
                              ❌ Reject
                            </button>
                          </>
                        )}
                        {application.status === 'shortlisted' && (
                          <button
                            onClick={() => handleUpdateApplicationStatus(application.id, 'hired')}
                            className="px-4 py-2 text-sm font-medium text-green-700 bg-green-50 border border-green-300 rounded-md hover:bg-green-100 transition-colors"
                          >
                            ✅ Hire
                          </button>
                        )}
                        {application.status === 'hired' && (
                          <span className="px-4 py-2 text-sm font-medium text-green-700 bg-green-100 border border-green-300 rounded-md">
                            🎉 Hired
                          </span>
                        )}
                        {application.status === 'rejected' && (
                          <span className="px-4 py-2 text-sm font-medium text-red-700 bg-red-100 border border-red-300 rounded-md">
                            ❌ Rejected
                          </span>
                        )}
                      </div>
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
