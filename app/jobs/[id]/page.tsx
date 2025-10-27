'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ApplyDialog } from '@/components/jobs/ApplyDialog';
import { SLAPreview } from '@/components/jobs/SLAPreview';
import ReactMarkdown from 'react-markdown';
import UserMenu from '@/components/UserMenu';
import Logo from '@/components/Logo';

interface Job {
  id: string;
  title: string;
  description: string;
  status: string;
  deadline_date: string;
  payout_type: string;
  payout_fixed: number;
  payout_min: number;
  payout_max: number;
  payment_terms: string;
  sla: any;
  credentials_required: string[];
  software_required: string[];
  specialization_keys: string[];
  location_states: string[];
  volume_count: number;
  working_expectations_md?: string;
  draft_eta_date?: string;
  final_review_buffer_days?: number;
  pro_liability_required?: boolean;
  trial_ok: boolean;
  insurance_required: boolean;
  location_us_only: boolean;
  location_countries: string[];
  remote_ok: boolean;
  created_by: string;
  created_at: string;
  firm: {
    name: string;
    verified: boolean;
    slug: string;
  };
}

export default function JobDetailPage() {
  const { user, isSignedIn } = useUser();
  const params = useParams();
  const router = useRouter();
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showApplyDialog, setShowApplyDialog] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [isClosingJob, setIsClosingJob] = useState(false);

  useEffect(() => {
    if (params.id) {
      fetchJob(params.id as string);
    }
  }, [params.id]);

  const fetchJob = async (jobId: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/jobs/${jobId}`);
      const data = await response.json();

      if (response.ok) {
        setJob(data.job);
        // Check if user is the owner
        if (isSignedIn && user) {
          checkOwnership(jobId);
        }
      } else {
        setError(data.error || 'Failed to load job');
      }
    } catch (error) {
      console.error('Error fetching job:', error);
      setError('Failed to load job');
    } finally {
      setLoading(false);
    }
  };

  const checkOwnership = async (jobId: string) => {
    try {
      const response = await fetch(`/api/jobs/${jobId}/check-ownership`);
      const data = await response.json();
      if (response.ok) {
        setIsOwner(data.isOwner);
      }
    } catch (error) {
      console.error('Error checking ownership:', error);
    }
  };

  const handleCloseJob = async () => {
    if (!job || !isOwner) return;
    
    if (!confirm('Are you sure you want to close this job? This action cannot be undone.')) {
      return;
    }

    setIsClosingJob(true);
    try {
      const response = await fetch(`/api/jobs/${job.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'closed' })
      });

      if (response.ok) {
        // Update the local job state
        setJob({ ...job, status: 'closed' });
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to close job');
      }
    } catch (error) {
      console.error('Error closing job:', error);
      alert('Failed to close job');
    } finally {
      setIsClosingJob(false);
    }
  };

  const formatPayout = (job: Job) => {
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

  const formatDeadline = (deadline: string | null) => {
    if (!deadline) return 'No deadline specified';
    
    const date = new Date(deadline);
    const today = new Date();
    const diffTime = date.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'Deadline passed';
    if (diffDays === 0) return 'Due today';
    if (diffDays === 1) return 'Due tomorrow';
    if (diffDays <= 7) return `Due in ${diffDays} days`;
    if (diffDays <= 30) return `Due in ${Math.ceil(diffDays / 7)} weeks`;
    return `Due ${date.toLocaleDateString()}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading job...</p>
        </div>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <div className="text-red-400 mb-4">
              <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-red-800 mb-2">Job Not Found</h3>
            <p className="text-red-700 mb-4">{error || 'The job you are looking for does not exist.'}</p>
            <button
              onClick={() => router.push('/jobs')}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
            >
              Back to Jobs
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Check if SLA exists and has valid content
  const hasValidSLA = job.sla && 
    typeof job.sla === 'object' && 
    job.sla !== null && 
    !Array.isArray(job.sla) &&
    Object.keys(job.sla).length > 0;

  console.log('SLA debug:', { 
    sla: job.sla, 
    type: typeof job.sla, 
    isArray: Array.isArray(job.sla),
    keys: job.sla ? Object.keys(job.sla) : 'no sla',
    hasValidSLA 
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-30 backdrop-blur bg-white/70 border-b border-slate-200">
        <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
          <Logo />
          <nav className="hidden md:flex items-center gap-6 text-sm text-slate-600">
            <a href="/" className="hover:text-slate-900">Home</a>
            <a href="/search" className="hover:text-slate-900">Search</a>
            <a href="/jobs" className="hover:text-slate-900 font-medium text-slate-900">Jobs</a>
            {!isSignedIn && (
              <a href="/join" className="hover:text-slate-900">Join</a>
            )}
          </nav>
          <div className="flex items-center gap-4">
            {isSignedIn ? (
              <UserMenu 
                userName={user?.fullName || undefined}
                userEmail={user?.primaryEmailAddress?.emailAddress}
              />
            ) : (
              <Link
                href="/join"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-slate-900 hover:bg-slate-800"
              >
                Join Now
              </Link>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <nav className="flex mb-6" aria-label="Breadcrumb">
          <ol className="inline-flex items-center space-x-1 md:space-x-3">
            <li className="inline-flex items-center">
              <Link href="/jobs" className="text-gray-500 hover:text-gray-700">
                Jobs
              </Link>
            </li>
            <li>
              <div className="flex items-center">
                <svg className="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
                <span className="text-gray-500 ml-1 md:ml-2">{job.title}</span>
              </div>
            </li>
          </ol>
        </nav>

        {/* Job Header */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="p-6">
            {/* Closed Banner */}
            {job.status === 'closed' && (
              <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-red-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <h2 className="text-lg font-semibold text-red-800">This position is closed</h2>
                </div>
                <p className="text-sm text-red-700 mt-1">This job is no longer accepting applications.</p>
              </div>
            )}

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{job.title}</h1>
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <span>Posted by {job.firm.name}</span>
                  {job.firm.verified && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      ✓ Verified Firm
                    </span>
                  )}
                  <span>{formatDeadline(job.deadline_date)}</span>
                </div>
              </div>
              
              <div className="flex gap-3 mt-4 sm:mt-0">
                {isOwner && job.status === 'open' && (
                  <button
                    onClick={handleCloseJob}
                    disabled={isClosingJob}
                    className="inline-flex items-center px-6 py-3 border border-red-300 text-base font-medium rounded-md text-red-700 bg-red-50 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                  >
                    {isClosingJob ? 'Closing...' : 'Close Job'}
                  </button>
                )}
                
                {isSignedIn && job.status === 'open' && (
                  <button
                    onClick={() => setShowApplyDialog(true)}
                    className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Apply Now
                  </button>
                )}
              </div>
            </div>

            {/* Key Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">Compensation</h3>
                <div className="space-y-2">
                  <p className="text-2xl font-bold text-blue-600">{formatPayout(job)}</p>
                  {job.payment_terms && (
                    <p className="text-sm text-gray-600">Payment: {job.payment_terms}</p>
                  )}
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">Requirements</h3>
                <div className="space-y-2">
                  {job.credentials_required.length > 0 && (
                    <div>
                      <span className="text-sm font-medium text-gray-700">Credentials: </span>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {job.credentials_required.map((cred) => (
                          <span key={cred} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {cred}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {job.software_required.length > 0 && (
                    <div>
                      <span className="text-sm font-medium text-gray-700">Software: </span>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {job.software_required.map((software) => (
                          <span key={software} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                            {software}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Specializations */}
            {job.specialization_keys.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-medium text-gray-900 mb-3">Specializations</h3>
                <div className="flex flex-wrap gap-2">
                  {job.specialization_keys.map((spec) => (
                    <span key={spec} className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
                      {spec}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Location & Remote */}
            <div className="mb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-3">Location & Work Arrangement</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <span className="text-sm font-medium text-gray-700">Location: </span>
                  {job.location_us_only ? (
                    <span className="text-gray-900">
                      US Only
                      {job.location_states.length > 0 && ` (${job.location_states.join(', ')})`}
                    </span>
                  ) : (
                    <span className="text-gray-900">
                      International
                      {job.location_countries.length > 0 && ` (${job.location_countries.join(', ')})`}
                    </span>
                  )}
                </div>
                
                <div>
                  <span className="text-sm font-medium text-gray-700">Remote: </span>
                  <span className={`font-medium ${job.remote_ok ? 'text-green-600' : 'text-red-600'}`}>
                    {job.remote_ok ? 'Remote OK' : 'On-site Required'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Job Description */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Job Description</h2>
            <div className="prose max-w-none">
              <p className="text-gray-700 whitespace-pre-wrap">{job.description}</p>
            </div>
          </div>
        </div>

        {/* Working Expectations */}
        {job.working_expectations_md && (
          <div className="bg-white rounded-lg shadow mb-6">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Working Expectations</h2>
              <article className="prose max-w-none mb-4">
                <ReactMarkdown>{job.working_expectations_md}</ReactMarkdown>
              </article>
              <div className="flex flex-wrap gap-2 text-xs">
                {job.draft_eta_date && (
                  <span className="rounded bg-gray-100 px-2 py-1">
                    Draft ETA: {formatDate(job.draft_eta_date)}
                  </span>
                )}
                <span className="rounded bg-gray-100 px-2 py-1">
                  Review buffer: {job.final_review_buffer_days || 3} business days
                </span>
                <span className="rounded bg-gray-100 px-2 py-1">
                  Liability: {job.pro_liability_required ? 'Required' : 'Not required'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* SLA Preview */}
        {hasValidSLA && (
          <div className="bg-white rounded-lg shadow mb-6">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Service Level Agreement</h2>
              <SLAPreview sla={job.sla} />
            </div>
          </div>
        )}

        {/* Additional Details */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Additional Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                {job.volume_count && (
                  <div>
                    <span className="text-sm font-medium text-gray-700">Volume: </span>
                    <span className="text-gray-900">{job.volume_count} returns</span>
                  </div>
                )}
                
                <div>
                  <span className="text-sm font-medium text-gray-700">Trial Period: </span>
                  <span className={`font-medium ${job.trial_ok ? 'text-green-600' : 'text-red-600'}`}>
                    {job.trial_ok ? 'Available' : 'Not Available'}
                  </span>
                </div>
                
                <div>
                  <span className="text-sm font-medium text-gray-700">Insurance Required: </span>
                  <span className={`font-medium ${(job.pro_liability_required || job.insurance_required) ? 'text-red-600' : 'text-green-600'}`}>
                    {(job.pro_liability_required || job.insurance_required) ? 'Yes' : 'No'}
                  </span>
                </div>
              </div>
              
              <div className="text-sm text-gray-600">
                <p>Posted: {new Date(job.created_at).toLocaleDateString()}</p>
                <p>Status: <span className="capitalize font-medium">{job.status}</span></p>
              </div>
            </div>
          </div>
        </div>

        {/* Apply Dialog */}
        {showApplyDialog && (
          <ApplyDialog
            job={job}
            onClose={() => setShowApplyDialog(false)}
            onSuccess={() => {
              setShowApplyDialog(false);
              // Optionally refresh the page or show success message
            }}
          />
        )}
      </div>
    </div>
  );
}
