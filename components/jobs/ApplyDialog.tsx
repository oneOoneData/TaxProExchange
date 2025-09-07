'use client';

import { useState } from 'react';
import { useUser } from '@clerk/nextjs';

interface Job {
  id: string;
  title: string;
  payout_type: string;
  payout_fixed?: number;
  payout_min?: number;
  payout_max?: number;
  firm: {
    name: string;
  };
}

interface ApplyDialogProps {
  job: Job;
  onClose: () => void;
  onSuccess: () => void;
}

interface ApplicationForm {
  cover_note: string;
  proposed_rate: string;
  proposed_payout_type: string;
  proposed_timeline: string;
}

export function ApplyDialog({ job, onClose, onSuccess }: ApplyDialogProps) {
  const { user } = useUser();
  const [formData, setFormData] = useState<ApplicationForm>({
    cover_note: '',
    proposed_rate: '',
    proposed_payout_type: job.payout_type,
    proposed_timeline: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (field: keyof ApplicationForm, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (error) setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.cover_note.trim()) {
      setError('Cover note is required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/jobs/${job.id}/apply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cover_note: formData.cover_note,
          proposed_rate: formData.proposed_rate ? parseFloat(formData.proposed_rate) : null,
          proposed_payout_type: formData.proposed_payout_type || null,
          proposed_timeline: formData.proposed_timeline || null,
        }),
      });

      if (response.ok) {
        onSuccess();
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to submit application');
      }
    } catch (error) {
      console.error('Error submitting application:', error);
      setError('Failed to submit application. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatJobPayout = () => {
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

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Apply to Job</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Job Summary */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h4 className="font-medium text-gray-900 mb-2">{job.title}</h4>
            <div className="text-sm text-gray-600 space-y-1">
              <p><span className="font-medium">Firm:</span> {job.firm.name}</p>
              <p><span className="font-medium">Compensation:</span> {formatJobPayout()}</p>
            </div>
          </div>

          {/* Application Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cover Note *
              </label>
              <textarea
                value={formData.cover_note}
                onChange={(e) => handleInputChange('cover_note', e.target.value)}
                rows={4}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Introduce yourself and explain why you're a great fit for this job..."
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Proposed Rate
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-gray-500">$</span>
                  <input
                    type="number"
                    value={formData.proposed_rate}
                    onChange={(e) => handleInputChange('proposed_rate', e.target.value)}
                    className="w-full border border-gray-300 rounded-md pl-8 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rate Type
                </label>
                <select
                  value={formData.proposed_payout_type}
                  onChange={(e) => handleInputChange('proposed_payout_type', e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Same as job</option>
                  <option value="fixed">Fixed Amount</option>
                  <option value="hourly">Hourly Rate</option>
                  <option value="per_return">Per Return</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Proposed Timeline
              </label>
              <input
                type="text"
                value={formData.proposed_timeline}
                onChange={(e) => handleInputChange('proposed_timeline', e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., 2 weeks, 30 days, etc."
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Submitting...' : 'Submit Application'}
              </button>
            </div>
          </form>

          {/* Application Tips */}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h4 className="text-sm font-medium text-blue-900 mb-2">Application Tips</h4>
            <ul className="text-xs text-blue-800 space-y-1">
              <li>• Be specific about your relevant experience</li>
              <li>• Mention any certifications or specializations</li>
              <li>• Explain why you're interested in this firm</li>
              <li>• Keep your cover note concise but informative</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
