'use client';

import { useState } from 'react';
import { Profile } from '@/lib/db/profile';
import { MentorshipPrefs } from '@/lib/types';

interface MentorshipStatusToggleProps {
  profile: Profile | null;
  preferences: MentorshipPrefs | null;
  onToggle?: (preferences: MentorshipPrefs) => Promise<void>;
}

export default function MentorshipStatusToggle({ profile, preferences, onToggle }: MentorshipStatusToggleProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isOpenToMentor, setIsOpenToMentor] = useState(preferences?.is_open_to_mentor ?? false);
  const [isSeekingMentor, setIsSeekingMentor] = useState(preferences?.is_seeking_mentor ?? false);

  const handleToggle = async (type: 'mentor' | 'mentee') => {
    if (!profile || isLoading) return;
    
    const newValue = type === 'mentor' ? !isOpenToMentor : !isSeekingMentor;
    
    // If toggling to open, we need to show the details modal
    if (newValue) {
      // Update the state immediately for UI feedback
      if (type === 'mentor') {
        setIsOpenToMentor(true);
      } else {
        setIsSeekingMentor(true);
      }
      
      // Call the parent to show the modal
      const newPreferences = {
        ...preferences,
        profile_id: profile.id,
        is_open_to_mentor: type === 'mentor' ? true : isOpenToMentor,
        is_seeking_mentor: type === 'mentee' ? true : isSeekingMentor,
        topics: preferences?.topics || [],
        software: preferences?.software || [],
        specializations: preferences?.specializations || [],
        mentoring_message: preferences?.mentoring_message || null
      };
      
      onToggle?.(newPreferences);
    } else {
      // If toggling to closed, update immediately
      setIsLoading(true);
      
      try {
        const newPreferences = {
          ...preferences,
          profile_id: profile.id,
          is_open_to_mentor: type === 'mentor' ? false : isOpenToMentor,
          is_seeking_mentor: type === 'mentee' ? false : isSeekingMentor,
          topics: preferences?.topics || [],
          software: preferences?.software || [],
          specializations: preferences?.specializations || [],
          mentoring_message: preferences?.mentoring_message || null
        };

        const response = await fetch('/api/mentorship/preferences', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(newPreferences),
        });

        if (response.ok) {
          const result = await response.json();
          if (type === 'mentor') {
            setIsOpenToMentor(false);
          } else {
            setIsSeekingMentor(false);
          }
          onToggle?.(result.preferences);
        } else {
          console.error('Failed to update mentorship preferences');
          // Revert the state on error
          if (type === 'mentor') {
            setIsOpenToMentor(true);
          } else {
            setIsSeekingMentor(true);
          }
        }
      } catch (error) {
        console.error('Error updating mentorship preferences:', error);
        // Revert the state on error
        if (type === 'mentor') {
          setIsOpenToMentor(true);
        } else {
          setIsSeekingMentor(true);
        }
      } finally {
        setIsLoading(false);
      }
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
    <div className="space-y-4">
      {/* Open to Mentoring */}
      <div className="flex items-center gap-3">
        <span className="text-sm text-gray-600">Open to mentoring:</span>
        <button
          onClick={() => handleToggle('mentor')}
          disabled={isLoading}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
            isOpenToMentor ? 'bg-blue-600' : 'bg-gray-200'
          } ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              isOpenToMentor ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
        <span className={`text-sm font-medium ${
          isOpenToMentor ? 'text-blue-600' : 'text-gray-500'
        }`}>
          {isOpenToMentor ? 'Open to mentor' : 'Not mentoring'}
        </span>
      </div>

      {/* Seeking Mentorship */}
      <div className="flex items-center gap-3">
        <span className="text-sm text-gray-600">Seeking mentorship:</span>
        <button
          onClick={() => handleToggle('mentee')}
          disabled={isLoading}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
            isSeekingMentor ? 'bg-blue-600' : 'bg-gray-200'
          } ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              isSeekingMentor ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
        <span className={`text-sm font-medium ${
          isSeekingMentor ? 'text-blue-600' : 'text-gray-500'
        }`}>
          {isSeekingMentor ? 'Seeking mentor' : 'Not seeking'}
        </span>
      </div>

      {isLoading && (
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm text-gray-500">Updating...</span>
        </div>
      )}
    </div>
  );
}
