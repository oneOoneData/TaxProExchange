import Link from 'next/link';
import Card from '@/components/ui/Card';

interface Job {
  id: string;
  title: string;
  description: string;
  applicantsCount?: number;
  status: 'active' | 'closed' | 'draft';
  createdAt: string;
  firm?: {
    name: string;
    verified: boolean;
    slug?: string;
  };
}

interface JobsPreviewProps {
  jobs?: Job[];
  canPostJobs?: boolean;
}

export default function JobsPreview({ jobs = [], canPostJobs = false }: JobsPreviewProps) {
  // Use real jobs data
  const userJobs: Job[] = jobs;

  return (
    <Card 
      title="Your Jobs" 
      description={userJobs.length > 0 ? `${userJobs.length} active job${userJobs.length > 1 ? 's' : ''} posted` : 'No jobs posted yet'}
      action={
        canPostJobs ? (
          <Link 
            href="/jobs/new"
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            Post New Job
          </Link>
        ) : (
          <Link 
            href="/jobs"
            className="text-sm text-gray-500 font-medium"
          >
            View Jobs
          </Link>
        )
      }
    >
      {userJobs.length === 0 ? (
        <div className="text-center py-6">
          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 01-2 2H10a2 2 0 01-2-2V6m8 0H8m8 0v6a2 2 0 01-2 2H10a2 2 0 01-2-2V6" />
            </svg>
          </div>
          <h4 className="font-medium text-gray-900 mb-1">No jobs posted yet</h4>
          <p className="text-sm text-gray-600 mb-3">
            {canPostJobs 
              ? 'Post your first job to find qualified tax professionals.'
              : 'Get verified to post jobs and find qualified professionals.'
            }
          </p>
          {canPostJobs ? (
            <Link
              href="/jobs/new"
              className="inline-flex items-center px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              Post Your First Job
            </Link>
          ) : (
            <Link
              href="/profile/edit#verification"
              className="inline-flex items-center px-3 py-2 bg-gray-600 text-white text-sm font-medium rounded-lg hover:bg-gray-700 transition-colors"
            >
              Get Verified
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {userJobs.slice(0, 3).map((job) => (
            <Link
              key={job.id}
              href={`/jobs/${job.id}`}
              className="block p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-start justify-between mb-2">
                <h4 className="text-sm font-medium text-gray-900 truncate">
                  {job.title}
                </h4>
                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                    job.status === 'active' ? 'bg-green-100 text-green-800' :
                    job.status === 'closed' ? 'bg-gray-100 text-gray-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {job.status}
                  </span>
                  <span className="text-xs text-gray-500">{job.createdAt}</span>
                </div>
              </div>
              
              <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                {job.description}
              </p>
              
              <div className="flex items-center justify-between">
                {job.applicantsCount !== undefined && (
                  <div className="flex items-center gap-1">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                    </svg>
                    <span className="text-sm text-gray-600">
                      {job.applicantsCount} applicant{job.applicantsCount !== 1 ? 's' : ''}
                    </span>
                  </div>
                )}
                
                <span className="text-xs text-blue-600 font-medium">
                  View Details
                </span>
              </div>
            </Link>
          ))}
          
          {userJobs.length > 3 && (
            <div className="text-center pt-2">
              <Link
                href="/jobs"
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                View {userJobs.length - 3} more jobs
              </Link>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
