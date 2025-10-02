import Link from 'next/link';
import Card from '@/components/ui/Card';

interface Job {
  id: string;
  title: string;
  description: string;
  status: 'active' | 'closed' | 'draft';
  createdAt: string;
  firm: {
    name: string;
    verified: boolean;
    slug?: string;
  };
  specialization_keys?: string[];
  location_states?: string[];
  software_required?: string[];
  payout_type?: string;
  payout_fixed?: number;
  payout_min?: number;
  payout_max?: number;
  remote_ok?: boolean;
}

interface RecentJobsPreviewProps {
  jobs?: Job[];
  userProfile?: {
    specializations?: string[];
    states?: string[];
    software?: string[];
    other_software?: string[];
  } | null;
}

function getMatchingHighlights(job: Job, userProfile: RecentJobsPreviewProps['userProfile']) {
  const highlights: string[] = [];
  
  if (!userProfile) return highlights;

  // Check specialization matches
  if (job.specialization_keys && userProfile.specializations) {
    const matchingSpecs = job.specialization_keys.filter(spec => 
      userProfile.specializations!.includes(spec)
    );
    if (matchingSpecs.length > 0) {
      highlights.push(`Matches ${matchingSpecs.length} specialization${matchingSpecs.length > 1 ? 's' : ''}`);
    }
  }

  // Check location matches
  if (job.location_states && userProfile.states) {
    const matchingStates = job.location_states.filter(state => 
      userProfile.states!.includes(state)
    );
    if (matchingStates.length > 0) {
      highlights.push(`Matches ${matchingStates.length} location${matchingStates.length > 1 ? 's' : ''}`);
    }
  }

  // Check software matches
  if (job.software_required && (userProfile.software || userProfile.other_software)) {
    const userSoftware = [...(userProfile.software || []), ...(userProfile.other_software || [])];
    const matchingSoftware = job.software_required.filter(software => 
      userSoftware.some(userSoft => 
        userSoft.toLowerCase().includes(software.toLowerCase()) || 
        software.toLowerCase().includes(userSoft.toLowerCase())
      )
    );
    if (matchingSoftware.length > 0) {
      highlights.push(`Matches ${matchingSoftware.length} software requirement${matchingSoftware.length > 1 ? 's' : ''}`);
    }
  }

  return highlights;
}

function formatPayout(job: Job): string {
  if (job.payout_type === 'fixed' && job.payout_fixed) {
    return `$${job.payout_fixed.toLocaleString()}`;
  }
  if (job.payout_type === 'hourly' && job.payout_min && job.payout_max) {
    return `$${job.payout_min}-${job.payout_max}/hr`;
  }
  if (job.payout_type === 'hourly' && job.payout_min) {
    return `$${job.payout_min}+/hr`;
  }
  return 'Payout not specified';
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - date.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 1) return '1 day ago';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
  return date.toLocaleDateString();
}

export default function RecentJobsPreview({ jobs = [], userProfile }: RecentJobsPreviewProps) {
  return (
    <Card 
      title="Recent Job Opportunities" 
      description={`${jobs.length} new job${jobs.length !== 1 ? 's' : ''} posted recently`}
      action={
        <Link 
          href="/jobs"
          className="text-sm text-blue-600 hover:text-blue-700 font-medium"
        >
          View All Jobs
        </Link>
      }
    >
      {jobs.length === 0 ? (
        <div className="text-center py-6">
          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 01-2 2H10a2 2 0 01-2-2V6m8 0H8m8 0v6a2 2 0 01-2 2H10a2 2 0 01-2-2V6" />
            </svg>
          </div>
          <h4 className="font-medium text-gray-900 mb-1">No recent jobs</h4>
          <p className="text-sm text-gray-600 mb-3">Check back later for new opportunities.</p>
          <Link
            href="/jobs"
            className="inline-flex items-center px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            Browse All Jobs
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {jobs.slice(0, 3).map((job) => {
            const highlights = getMatchingHighlights(job, userProfile);
            const hasMatches = highlights.length > 0;
            
            return (
              <Link
                key={job.id}
                href={`/jobs/${job.id}`}
                className={`block p-3 rounded-lg transition-colors ${
                  hasMatches 
                    ? 'bg-blue-50 border border-blue-200 hover:bg-blue-100' 
                    : 'bg-gray-50 hover:bg-gray-100'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <h4 className="text-sm font-medium text-gray-900 truncate flex-1">
                    {job.title}
                  </h4>
                  <div className="flex items-center gap-2 ml-2">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                      job.status === 'active' ? 'bg-green-100 text-green-800' :
                      job.status === 'closed' ? 'bg-gray-100 text-gray-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {job.status}
                    </span>
                    <span className="text-xs text-gray-500">{formatDate(job.createdAt)}</span>
                  </div>
                </div>
                
                <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                  {job.description}
                </p>
                
                {/* Matching highlights */}
                {hasMatches && (
                  <div className="mb-2">
                    <div className="flex items-center gap-1 text-xs text-blue-700">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span className="font-medium">Good match:</span>
                      <span>{highlights.join(', ')}</span>
                    </div>
                  </div>
                )}
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                      <span className="text-sm text-gray-600">{job.firm.name}</span>
                      {job.firm.verified && (
                        <svg className="w-3 h-3 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                      </svg>
                      <span className="text-sm text-gray-600">{formatPayout(job)}</span>
                    </div>
                    {job.remote_ok && (
                      <div className="flex items-center gap-1">
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        <span className="text-sm text-gray-600">Remote OK</span>
                      </div>
                    )}
                  </div>
                  
                  <span className="text-xs text-blue-600 font-medium">
                    View Details
                  </span>
                </div>
              </Link>
            );
          })}
          
          {jobs.length > 3 && (
            <div className="text-center pt-2">
              <Link
                href="/jobs"
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                View {jobs.length - 3} more recent jobs
              </Link>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
