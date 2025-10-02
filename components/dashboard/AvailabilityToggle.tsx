'use client';

import { useState } from 'react';
import { Profile } from '@/lib/db/profile';

interface AvailabilityToggleProps {
  profile: Profile | null;
  onToggle?: (accepting: boolean) => Promise<void>;
}

export default function AvailabilityToggle({ profile, onToggle }: AvailabilityToggleProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [acceptingWork, setAcceptingWork] = useState(profile?.accepting_work ?? true);

  const handleToggle = async () => {
    if (!profile || isLoading) return;
    
    setIsLoading(true);
    const newValue = !acceptingWork;
    
    try {
      const response = await fetch('/api/profile/availability', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ accepting_work: newValue }),
      });

      if (response.ok) {
        setAcceptingWork(newValue);
        onToggle?.(newValue);
      } else {
        console.error('Failed to update availability');
      }
    } catch (error) {
      console.error('Error updating availability:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!profile) {
    return (
      <div className="flex items-center gap-2">
        <div className="w-4 h-4 bg-gray-200 rounded-full animate-pulse"></div>
        <span className="text-sm text-gray-500">Loading...</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-gray-600">Availability:</span>
      <button
        onClick={handleToggle}
        disabled={isLoading}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
          acceptingWork ? 'bg-blue-600' : 'bg-gray-200'
        } ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            acceptingWork ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
      <span className={`text-sm font-medium ${
        acceptingWork ? 'text-blue-600' : 'text-gray-500'
      }`}>
        {acceptingWork ? 'Accepting work' : 'Not accepting'}
      </span>
      {isLoading && (
        <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      )}
    </div>
  );
}
