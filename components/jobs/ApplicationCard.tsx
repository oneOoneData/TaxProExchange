'use client';

import { useState } from 'react';

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

interface ApplicationCardProps {
  application: Application;
  onStatusUpdate: (applicationId: string, newStatus: string, notes?: string) => Promise<void>;
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

export function ApplicationCard({ application, onStatusUpdate }: ApplicationCardProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [notes, setNotes] = useState(application.notes || '');
  const [selectedStatus, setSelectedStatus] = useState(application.status);

  const handleStatusUpdate = async () => {
    setIsUpdating(true);
    try {
      await onStatusUpdate(application.id, selectedStatus, notes);
      setShowNotes(false);
    } catch (error) {
      console.error('Failed to update status:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatRate = () => {
    if (!application.proposed_rate) return 'Not specified';
    if (application.proposed_timeline) {
      return `$${application.proposed_rate} (${application.proposed_timeline})`;
    }
    return `$${application.proposed_rate}`;
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            {application.applicant.name}
          </h3>
          <p className="text-sm text-gray-600">{application.applicant.headline}</p>
          <p className="text-xs text-gray-500">{application.applicant.credential_type}</p>
        </div>
        
        <div className="flex items-center gap-2">
          <span className={`px-3 py-1 text-xs font-medium rounded-full border ${statusColors[application.status as keyof typeof statusColors]}`}>
            {statusLabels[application.status as keyof typeof statusLabels]}
          </span>
          <span className="text-xs text-gray-500">
            {formatDate(application.created_at)}
          </span>
        </div>
      </div>

      {/* Application Details */}
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">Proposed Terms</h4>
          <div className="space-y-1 text-sm text-gray-600">
            <p><span className="font-medium">Rate:</span> {formatRate()}</p>
            <p><span className="font-medium">Type:</span> {application.proposed_payout_type || 'Not specified'}</p>
          </div>
        </div>
        
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">Cover Note</h4>
          <p className="text-sm text-gray-600 italic">
            "{application.cover_note}"
          </p>
        </div>
      </div>

      {/* Notes Section */}
      {application.notes && (
        <div className="bg-gray-50 p-3 rounded-md">
          <h4 className="text-sm font-medium text-gray-700 mb-1">Notes</h4>
          <p className="text-sm text-gray-600">{application.notes}</p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-200">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowNotes(!showNotes)}
            className="text-sm text-gray-600 hover:text-gray-800 underline"
          >
            {showNotes ? 'Hide' : 'Add/Edit'} Notes
          </button>
        </div>
        
        <div className="flex items-center gap-3">
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="text-sm border border-gray-300 rounded-md px-2 py-1"
          >
            <option value="applied">Applied</option>
            <option value="shortlisted">Shortlisted</option>
            <option value="hired">Hired</option>
            <option value="rejected">Rejected</option>
            <option value="completed">Completed</option>
          </select>
          
          <button
            onClick={handleStatusUpdate}
            disabled={isUpdating || selectedStatus === application.status}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isUpdating ? 'Updating...' : 'Update Status'}
          </button>
        </div>
      </div>

      {/* Notes Input */}
      {showNotes && (
        <div className="pt-4 border-t border-gray-200">
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add notes about this application..."
            rows={3}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      )}

      {/* View Profile Link */}
      <div className="pt-2">
        <a
          href={`/p/${application.applicant.slug}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-blue-600 hover:text-blue-800 underline"
        >
          View Applicant Profile →
        </a>
      </div>
    </div>
  );
}
