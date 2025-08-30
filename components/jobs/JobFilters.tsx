'use client';

interface JobFilters {
  specialization: string;
  state: string;
  payout_type: string;
  min_payout: string;
  deadline: string;
  remote: string;
}

interface JobFiltersProps {
  filters: JobFilters;
  onFilterChange: (filters: Partial<JobFilters>) => void;
  onClearFilters: () => void;
}

export function JobFilters({ filters, onFilterChange, onClearFilters }: JobFiltersProps) {
  const specializations = [
    's_corp', 'multi_state', 'real_estate', 'crypto', 'irs_rep',
    '1040', 'business', 'partnership', 'estate_tax', 'international'
  ];

  const states = [
    'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
    'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
    'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
    'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
    'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
  ];

  const payoutTypes = [
    { value: 'fixed', label: 'Fixed Amount' },
    { value: 'hourly', label: 'Hourly Rate' },
    { value: 'per_return', label: 'Per Return' }
  ];

  const deadlineOptions = [
    { value: 'this_week', label: 'This Week' },
    { value: 'next_30_days', label: 'Next 30 Days' },
    { value: 'next_60_days', label: 'Next 60 Days' }
  ];

  const remoteOptions = [
    { value: 'true', label: 'Remote Only' },
    { value: 'false', label: 'On-site Only' }
  ];

  const formatSpecialization = (slug: string) => {
    const labels: Record<string, string> = {
      's_corp': 'S-Corporation',
      'multi_state': 'Multi-State',
      'real_estate': 'Real Estate',
      'crypto': 'Cryptocurrency',
      'irs_rep': 'IRS Representation',
      '1040': 'Individual Returns',
      'business': 'Business Returns',
      'partnership': 'Partnership Returns',
      'estate_tax': 'Estate & Gift Tax',
      'international': 'International Tax'
    };
    return labels[slug] || slug;
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900">Filters</h3>
        <button
          onClick={onClearFilters}
          className="text-sm text-blue-600 hover:text-blue-800"
          suppressHydrationWarning
        >
          Clear All
        </button>
      </div>

      <div className="space-y-6">
        {/* Specialization */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Specialization
          </label>
          <select
            value={filters.specialization}
            onChange={(e) => onFilterChange({ specialization: e.target.value })}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            suppressHydrationWarning
          >
            <option value="">All Specializations</option>
            {specializations.map((spec) => (
              <option key={spec} value={spec}>
                {formatSpecialization(spec)}
              </option>
            ))}
          </select>
        </div>

        {/* State */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            State
          </label>
          <select
            value={filters.state}
            onChange={(e) => onFilterChange({ state: e.target.value })}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            suppressHydrationWarning
          >
            <option value="">All States</option>
            {states.map((state) => (
              <option key={state} value={state}>
                {state}
              </option>
            ))}
          </select>
        </div>

        {/* Payout Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Payout Type
          </label>
          <select
            value={filters.payout_type}
            onChange={(e) => onFilterChange({ payout_type: e.target.value })}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            suppressHydrationWarning
          >
            <option value="">All Types</option>
            {payoutTypes.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>

        {/* Minimum Payout */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Minimum Payout
          </label>
          <input
            type="number"
            value={filters.min_payout}
            onChange={(e) => onFilterChange({ min_payout: e.target.value })}
            placeholder="e.g., 1000"
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            suppressHydrationWarning
          />
        </div>

        {/* Deadline */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Deadline
          </label>
          <select
            value={filters.deadline}
            onChange={(e) => onFilterChange({ deadline: e.target.value })}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            suppressHydrationWarning
          >
            <option value="">Any Deadline</option>
            {deadlineOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Remote */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Work Arrangement
          </label>
          <select
            value={filters.remote}
            onChange={(e) => onFilterChange({ remote: e.target.value })}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            suppressHydrationWarning
          >
            <option value="">Any Arrangement</option>
            {remoteOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Active Filters Summary */}
      {Object.values(filters).some(value => value) && (
        <div className="mt-6 pt-4 border-t border-gray-200">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Active Filters:</h4>
          <div className="flex flex-wrap gap-2">
            {filters.specialization && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {formatSpecialization(filters.specialization)}
                <button
                  onClick={() => onFilterChange({ specialization: '' })}
                  className="ml-1 text-blue-600 hover:text-blue-800"
                >
                  ×
                </button>
              </span>
            )}
            {filters.state && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                {filters.state}
                <button
                  onClick={() => onFilterChange({ state: '' })}
                  className="ml-1 text-green-600 hover:text-green-800"
                >
                  ×
                </button>
              </span>
            )}
            {filters.payout_type && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                {payoutTypes.find(t => t.value === filters.payout_type)?.label}
                <button
                  onClick={() => onFilterChange({ payout_type: '' })}
                  className="ml-1 text-purple-600 hover:text-purple-800"
                >
                  ×
                </button>
              </span>
            )}
            {filters.min_payout && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                Min: ${filters.min_payout}
                <button
                  onClick={() => onFilterChange({ min_payout: '' })}
                  className="ml-1 text-yellow-600 hover:text-yellow-800"
                >
                  ×
                </button>
              </span>
            )}
            {filters.deadline && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                {deadlineOptions.find(d => d.value === filters.deadline)?.label}
                <button
                  onClick={() => onFilterChange({ deadline: '' })}
                  className="ml-1 text-orange-600 hover:text-orange-800"
                >
                  ×
                </button>
              </span>
            )}
            {filters.remote && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                {remoteOptions.find(r => r.value === filters.remote)?.label}
                <button
                  onClick={() => onFilterChange({ remote: '' })}
                  className="ml-1 text-indigo-600 hover:text-indigo-800"
                >
                  ×
                </button>
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
