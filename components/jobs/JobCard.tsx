'use client';

import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';

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
  credentials_required: string[];
  software_required: string[];
  specialization_keys: string[];
  volume_count: number;
  trial_ok: boolean;
  insurance_required: boolean;
  location_us_only: boolean;
  location_states: string[];
  location_countries: string[];
  remote_ok: boolean;
  created_at: string;
  firm: {
    name: string;
    verified: boolean;
    slug: string;
  };
}

interface JobCardProps {
  job: Job;
  isOwner?: boolean;
}

export function JobCard({ job, isOwner = false }: JobCardProps) {
  const formatPayout = () => {
    if (job.payout_type === 'fixed') {
      return `$${job.payout_fixed?.toLocaleString()}`;
    } else if (job.payout_type === 'hourly') {
      return `$${job.payout_min?.toLocaleString()}/hr - $${job.payout_max?.toLocaleString()}/hr`;
    } else if (job.payout_type === 'per_return') {
      return `$${job.payout_min?.toLocaleString()} - $${job.payout_max?.toLocaleString()} per return`;
    }
    return 'Compensation not specified';
  };

  const formatDeadline = () => {
    if (!job.deadline_date) return 'No deadline';
    
    const date = new Date(job.deadline_date);
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

  const getLocationDisplay = () => {
    if (job.location_us_only) {
      if (job.location_states.length > 0) {
        return job.location_states.join(', ');
      }
      return 'US Only';
    } else {
      if (job.location_countries.length > 0) {
        return job.location_countries.join(', ');
      }
      return 'International';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow hover:shadow-md transition-shadow duration-200">
      <div className="p-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-4">
          <div className="flex-1">
            <Link 
              href={`/jobs/${job.id}`}
              className="text-xl font-semibold text-gray-900 hover:text-blue-600 transition-colors duration-200"
            >
              {job.title}
            </Link>
            <div className="flex items-center space-x-3 mt-2 text-sm text-gray-600">
              <span>{job.firm.name}</span>
              {job.firm.verified && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  ✓ Verified
                </span>
              )}
              <span>•</span>
              <span>{formatDistanceToNow(new Date(job.created_at), { addSuffix: true })}</span>
            </div>
          </div>
          
          <div className="mt-3 sm:mt-0 sm:ml-4 text-right">
            <div className="text-2xl font-bold text-blue-600">{formatPayout()}</div>
            {job.payment_terms && (
              <div className="text-sm text-gray-500">{job.payment_terms}</div>
            )}
          </div>
        </div>

        {/* Description */}
        <p className="text-gray-700 mb-4 line-clamp-3">
          {job.description.length > 200 
            ? `${job.description.substring(0, 200)}...` 
            : job.description
          }
        </p>

        {/* Key Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <span className="text-sm font-medium text-gray-700">Deadline: </span>
            <span className={`text-sm font-medium ${
              job.deadline_date && new Date(job.deadline_date) < new Date() 
                ? 'text-red-600' 
                : 'text-gray-900'
            }`}>
              {formatDeadline()}
            </span>
          </div>
          
          <div>
            <span className="text-sm font-medium text-gray-700">Location: </span>
            <span className="text-sm text-gray-900">{getLocationDisplay()}</span>
          </div>
          
          <div>
            <span className="text-sm font-medium text-gray-700">Remote: </span>
            <span className={`text-sm font-medium ${job.remote_ok ? 'text-green-600' : 'text-red-600'}`}>
              {job.remote_ok ? 'Remote OK' : 'On-site'}
            </span>
          </div>
        </div>

        {/* Requirements Badges */}
        <div className="mb-4">
          <div className="flex flex-wrap gap-2">
            {job.credentials_required.slice(0, 3).map((cred) => (
              <span key={cred} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {cred}
              </span>
            ))}
            {job.software_required.slice(0, 2).map((software) => (
              <span key={software} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                {software}
              </span>
            ))}
            {job.specialization_keys.slice(0, 2).map((spec) => (
              <span key={spec} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                {spec}
              </span>
            ))}
            {job.credentials_required.length + job.software_required.length + job.specialization_keys.length > 7 && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                +{job.credentials_required.length + job.software_required.length + job.specialization_keys.length - 7} more
              </span>
            )}
          </div>
        </div>

        {/* Additional Info */}
        <div className="flex flex-wrap items-center justify-between text-sm text-gray-600">
          <div className="flex items-center space-x-4">
            {job.volume_count && (
              <span>{job.volume_count} returns</span>
            )}
            {job.trial_ok && (
              <span className="text-green-600">Trial available</span>
            )}
            {job.insurance_required && (
              <span className="text-orange-600">Insurance required</span>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            {isOwner && (
              <Link
                href={`/jobs/${job.id}/applications`}
                className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors duration-200"
              >
                View Applications
              </Link>
            )}
            <Link
              href={`/jobs/${job.id}`}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
            >
              View Details
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
