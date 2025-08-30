'use client';

interface SLAObject {
  response_time_hours?: number;
  draft_turnaround_days?: number;
  revision_rounds_included?: number;
  data_exchange?: string;
  security?: string;
  dispute?: string;
  [key: string]: any;
}

interface SLAPreviewProps {
  sla: SLAObject | string | null | undefined;
}

export function SLAPreview({ sla }: SLAPreviewProps) {
  // Handle null/undefined cases
  if (!sla) {
    return (
      <div className="text-center py-8 text-gray-500">
        <svg className="mx-auto h-12 w-12 text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
        <p>No SLA terms specified</p>
      </div>
    );
  }

  // Handle string case - render as plain text
  if (typeof sla === 'string') {
    return (
      <div className="bg-gray-50 rounded-lg p-4">
        <p className="text-gray-700 whitespace-pre-wrap">{sla}</p>
      </div>
    );
  }

  // Handle array case (shouldn't happen but safety first)
  if (Array.isArray(sla)) {
    return (
      <div className="text-center py-8 text-gray-500">
        <svg className="mx-auto h-12 w-12 text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
        <p>Invalid SLA format</p>
      </div>
    );
  }

  // Handle object case - ensure it's actually an object
  if (typeof sla !== 'object' || sla === null) {
    console.warn('SLAPreview: Unexpected SLA type:', { sla, type: typeof sla });
    return (
      <div className="text-center py-8 text-gray-500">
        <svg className="mx-auto h-12 w-12 text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
        <p>Invalid SLA format</p>
      </div>
    );
  }

  // At this point, sla is guaranteed to be an object
  const slaObject = sla as SLAObject;

  // Check if object is empty
  if (Object.keys(slaObject).length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <svg className="mx-auto h-12 w-12 text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
        <p>No SLA terms specified</p>
      </div>
    );
  }

  const formatSLAValue = (key: string, value: any) => {
    if (typeof value === 'number') {
      if (key.includes('hours')) {
        return `${value} hour${value !== 1 ? 's' : ''}`;
      }
      if (key.includes('days')) {
        return `${value} day${value !== 1 ? 's' : ''}`;
      }
      if (key.includes('rounds')) {
        return `${value} round${value !== 1 ? 's' : ''}`;
      }
      return value.toString();
    }
    // Ensure string values are safely rendered
    if (typeof value === 'string') {
      return value;
    }
    // For any other type, convert to string safely
    return String(value);
  };

  const getSLAIcon = (key: string) => {
    if (key.includes('response') || key.includes('turnaround')) {
      return (
        <svg className="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    }
    if (key.includes('security') || key.includes('data')) {
      return (
        <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      );
    }
    if (key.includes('dispute') || key.includes('revision')) {
      return (
        <svg className="w-5 h-5 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    }
    return (
      <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
    );
  };

  const getSLACategory = (key: string) => {
    if (key.includes('response') || key.includes('turnaround') || key.includes('rounds')) {
      return 'Timeline';
    }
    if (key.includes('security') || key.includes('data')) {
      return 'Security & Data';
    }
    if (key.includes('dispute')) {
      return 'Dispute Resolution';
    }
    return 'Other';
  };

  const groupSLATerms = () => {
    const groups: Record<string, Array<[string, any]>> = {
      'Timeline': [],
      'Security & Data': [],
      'Dispute Resolution': [],
      'Other': []
    };

    Object.entries(slaObject).forEach(([key, value]) => {
      // Only include non-null, non-undefined, non-empty values
      if (value !== null && value !== undefined && value !== '') {
        const category = getSLACategory(key);
        groups[category].push([key, value]);
      }
    });

    return groups;
  };

  const formatSLAKey = (key: string) => {
    return key
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const slaGroups = groupSLATerms();

  // Check if any groups have content
  const hasContent = Object.values(slaGroups).some(group => group.length > 0);
  
  if (!hasContent) {
    return (
      <div className="text-center py-8 text-gray-500">
        <svg className="mx-auto h-12 w-12 text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
        <p>No SLA terms specified</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {Object.entries(slaGroups).map(([category, terms]) => {
        if (terms.length === 0) return null;
        
        return (
          <div key={category}>
            <h4 className="text-sm font-medium text-gray-900 mb-3 border-b border-gray-200 pb-2">
              {category}
            </h4>
            <div className="space-y-3">
              {terms.map(([key, value]) => (
                <div key={key} className="flex items-start space-x-3">
                  <div className="flex-shrink-0 mt-0.5">
                    {getSLAIcon(key)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-700">
                      {formatSLAKey(key)}
                    </p>
                    <p className="text-sm text-gray-600">
                      {formatSLAValue(key, value)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
