'use client';

import { useState } from 'react';

interface Location {
  state: string;
  city?: string;
}

interface LocationDisplayProps {
  locations: Location[];
  worksMultistate: boolean;
  worksInternational: boolean;
  countries: string[];
  primaryLocation?: {
    country: string;
    state?: string;
    city?: string;
    display_name?: string;
  };
  locationRadius?: number;
  className?: string;
}

export default function LocationDisplay({
  locations,
  worksMultistate,
  worksInternational,
  countries,
  primaryLocation,
  locationRadius = 50,
  className = ''
}: LocationDisplayProps) {
  const [showAllLocations, setShowAllLocations] = useState(false);

  const getLocationText = () => {
    if (worksMultistate) {
      return 'All US States';
    }
    
    if (worksInternational) {
      if (countries.length > 0) {
        return `International (${countries.join(', ')})`;
      }
      return 'International';
    }

    if (primaryLocation?.display_name) {
      return primaryLocation.display_name;
    }

    if (primaryLocation?.city && primaryLocation?.state) {
      return `${primaryLocation.city}, ${primaryLocation.state}`;
    }

    if (primaryLocation?.state) {
      return primaryLocation.state;
    }

    if (locations.length > 0) {
      const mainLocation = locations[0];
      if (mainLocation.city && mainLocation.state) {
        return `${mainLocation.city}, ${mainLocation.state}`;
      }
      if (mainLocation.state) {
        return mainLocation.state;
      }
    }

    return 'Remote';
  };

  const getServiceAreaText = () => {
    if (worksMultistate) {
      return 'Serves all US states';
    }
    
    if (worksInternational) {
      return 'Serves international clients';
    }

    if (locationRadius && locationRadius > 0) {
      return `Serves within ${locationRadius} miles`;
    }

    return 'Location-based services';
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Location Icon */}
      <div className="flex-shrink-0">
        <svg 
          className="w-5 h-5 text-slate-500" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" 
          />
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" 
          />
        </svg>
      </div>

      {/* Location Info */}
      <div className="flex-1 min-w-0">
        <div className="font-medium text-slate-900">
          {getLocationText()}
        </div>
        <div className="text-sm text-slate-600">
          {getServiceAreaText()}
        </div>
        
        {/* Show additional locations if available */}
        {locations.length > 1 && !worksMultistate && !worksInternational && (
          <div className="mt-1">
            <button
              onClick={() => setShowAllLocations(!showAllLocations)}
              className="text-xs text-slate-500 hover:text-slate-700 underline"
            >
              {showAllLocations ? 'Show less' : `+${locations.length - 1} more locations`}
            </button>
            
            {showAllLocations && (
              <div className="mt-2 space-y-1">
                {locations.slice(1).map((location, index) => (
                  <div key={index} className="text-xs text-slate-600">
                    {location.city && location.state 
                      ? `${location.city}, ${location.state}`
                      : location.state
                    }
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Status Badge */}
      <div className="flex-shrink-0">
        {worksMultistate && (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            Multi-State
          </span>
        )}
        {worksInternational && !worksMultistate && (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
            International
          </span>
        )}
        {!worksMultistate && !worksInternational && (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-800">
            Local
          </span>
        )}
      </div>
    </div>
  );
}
