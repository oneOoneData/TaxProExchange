'use client';

import { useState } from 'react';
import Link from "next/link";
import { Profile } from '@/lib/db/profile';
import { MentorshipPrefs } from '@/lib/types';
import MentorshipStatusToggle from '@/components/dashboard/MentorshipStatusToggle';
import MentorshipDetailsModal from '@/components/dashboard/MentorshipDetailsModal';

interface MentorshipPageClientProps {
  profile: Profile;
  preferences: MentorshipPrefs | null;
  matches: any[];
  allMentors?: any[];
}

export default function MentorshipPageClient({ profile, preferences, matches, allMentors = [] }: MentorshipPageClientProps) {
  const [currentPreferences, setCurrentPreferences] = useState<MentorshipPrefs | null>(preferences);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [modalType, setModalType] = useState<'mentor' | 'mentee'>('mentor');

  const hasPreferences = currentPreferences && (currentPreferences.is_open_to_mentor || currentPreferences.is_seeking_mentor);

  const handleToggle = async (newPreferences: MentorshipPrefs) => {
    // Show modal when toggling to open (for both mentor and mentee)
    if (newPreferences.is_open_to_mentor && !currentPreferences?.is_open_to_mentor) {
      setCurrentPreferences(newPreferences);
      setModalType('mentor');
      setShowDetailsModal(true);
    } else if (newPreferences.is_seeking_mentor && !currentPreferences?.is_seeking_mentor) {
      setCurrentPreferences(newPreferences);
      setModalType('mentee');
      setShowDetailsModal(true);
    } else {
      // If toggling to closed, save immediately
      setCurrentPreferences(newPreferences);
      try {
        const response = await fetch('/api/mentorship/preferences', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(newPreferences),
        });

        if (response.ok) {
          const result = await response.json();
          setCurrentPreferences(result.preferences);
        }
      } catch (error) {
        console.error('Error updating mentorship preferences:', error);
      }
    }
  };

  const handleSaveDetails = async (updatedPreferences: MentorshipPrefs) => {
    try {
      const response = await fetch('/api/mentorship/preferences', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedPreferences),
      });

      if (response.ok) {
        const result = await response.json();
        setCurrentPreferences(result.preferences);
      } else {
        console.error('Failed to save mentorship preferences');
      }
    } catch (error) {
      console.error('Error saving mentorship preferences:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Mentorship</h1>
          <p className="text-gray-600 mt-2">
            Connect with tax professionals for mentorship opportunities
          </p>
        </div>

        {/* Status Toggle */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Mentorship Status</h2>
          <MentorshipStatusToggle
            profile={profile}
            preferences={currentPreferences}
            onToggle={handleToggle}
          />
        </div>

        {/* Preferences Check */}
        {!hasPreferences && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">
                  Set up your mentorship preferences
                </h3>
                <div className="mt-2 text-sm text-blue-700">
                  <p>
                    Use the toggles above to indicate whether you're open to mentoring others or seeking mentorship.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Matches */}
        {hasPreferences && (
          <>
            {matches.length > 0 ? (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-900">
                  {currentPreferences?.is_seeking_mentor && currentPreferences?.is_open_to_mentor 
                    ? "Mentorship Opportunities" 
                    : currentPreferences?.is_seeking_mentor 
                    ? "Potential Mentors" 
                    : "Potential Mentees"
                  }
                </h2>
                
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {matches.map((match: any) => (
                    <div key={match.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="text-lg font-medium text-gray-900">
                            {match.first_name} {match.last_name}
                          </h3>
                          {match.headline && (
                            <p className="text-sm text-gray-600 mt-1">{match.headline}</p>
                          )}
                          {match.firm_name && (
                            <p className="text-sm text-gray-500 mt-1">{match.firm_name}</p>
                          )}
                          <p className="text-sm text-gray-500 mt-1">
                            {match.credential_type}
                          </p>
                        </div>
                      </div>

                      {/* Topics */}
                      {match.mentorship_preferences?.[0]?.topics && (
                        <div className="mt-4">
                          <div className="flex flex-wrap gap-1">
                            {match.mentorship_preferences[0].topics.slice(0, 4).map((topic: string) => (
                              <span
                                key={topic}
                                className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                              >
                                {topic.replace("software_", "").replace(/_/g, " ").toUpperCase()}
                              </span>
                            ))}
                            {match.mentorship_preferences[0].topics.length > 4 && (
                              <span className="text-xs text-gray-500">
                                +{match.mentorship_preferences[0].topics.length - 4} more
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Software */}
                      {match.mentorship_preferences?.[0]?.software && match.mentorship_preferences[0].software.length > 0 && (
                        <div className="mt-4">
                          <p className="text-xs text-gray-500 mb-1">Software:</p>
                          <div className="flex flex-wrap gap-1">
                            {match.mentorship_preferences[0].software.slice(0, 3).map((software: string) => (
                              <span
                                key={software}
                                className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                              >
                                {software.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())}
                              </span>
                            ))}
                            {match.mentorship_preferences[0].software.length > 3 && (
                              <span className="text-xs text-gray-500">
                                +{match.mentorship_preferences[0].software.length - 3} more
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Specializations */}
                      {match.mentorship_preferences?.[0]?.specializations && match.mentorship_preferences[0].specializations.length > 0 && (
                        <div className="mt-4">
                          <p className="text-xs text-gray-500 mb-1">Expertise:</p>
                          <div className="flex flex-wrap gap-1">
                            {match.mentorship_preferences[0].specializations.slice(0, 3).map((spec: string) => (
                              <span
                                key={spec}
                                className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800"
                              >
                                {spec}
                              </span>
                            ))}
                            {match.mentorship_preferences[0].specializations.length > 3 && (
                              <span className="text-xs text-gray-500">
                                +{match.mentorship_preferences[0].specializations.length - 3} more
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Mentoring Message */}
                      {match.mentorship_preferences?.[0]?.mentoring_message && (
                        <div className="mt-4">
                          <p className="text-xs text-gray-500 mb-1">Message:</p>
                          <p className="text-sm text-gray-700 italic">
                            "{match.mentorship_preferences[0].mentoring_message}"
                          </p>
                        </div>
                      )}


                      {/* Connect Button */}
                      <div className="mt-6">
                        <Link
                          href={`/p/${match.slug || match.id}`}
                          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                        >
                          View Profile & Connect
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : allMentors.length > 0 ? (
              <div className="space-y-6">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                  <p className="text-sm text-yellow-800">
                    <strong>No exact matches found based on your topics and location.</strong>
                  </p>
                  <p className="text-sm text-yellow-700 mt-1">
                    Here are all available {currentPreferences?.is_seeking_mentor ? "mentors" : "mentees"}:
                  </p>
                </div>

                <h2 className="text-xl font-semibold text-gray-900">
                  All {currentPreferences?.is_seeking_mentor ? "Available Mentors" : "Available Mentees"}
                </h2>
                
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {allMentors.map((match: any) => (
                    <div key={match.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="text-lg font-medium text-gray-900">
                            {match.first_name} {match.last_name}
                          </h3>
                          {match.headline && (
                            <p className="text-sm text-gray-600 mt-1">{match.headline}</p>
                          )}
                          {match.firm_name && (
                            <p className="text-sm text-gray-500 mt-1">{match.firm_name}</p>
                          )}
                          <p className="text-sm text-gray-500 mt-1">
                            {match.credential_type}
                          </p>
                        </div>
                      </div>

                      {/* Topics */}
                      {match.mentorship_preferences?.[0]?.topics && (
                        <div className="mt-4">
                          <div className="flex flex-wrap gap-1">
                            {match.mentorship_preferences[0].topics.slice(0, 4).map((topic: string) => (
                              <span
                                key={topic}
                                className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                              >
                                {topic.replace("software_", "").replace(/_/g, " ").toUpperCase()}
                              </span>
                            ))}
                            {match.mentorship_preferences[0].topics.length > 4 && (
                              <span className="text-xs text-gray-500">
                                +{match.mentorship_preferences[0].topics.length - 4} more
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Software */}
                      {match.mentorship_preferences?.[0]?.software && match.mentorship_preferences[0].software.length > 0 && (
                        <div className="mt-4">
                          <p className="text-xs text-gray-500 mb-1">Software:</p>
                          <div className="flex flex-wrap gap-1">
                            {match.mentorship_preferences[0].software.slice(0, 3).map((software: string) => (
                              <span
                                key={software}
                                className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                              >
                                {software.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())}
                              </span>
                            ))}
                            {match.mentorship_preferences[0].software.length > 3 && (
                              <span className="text-xs text-gray-500">
                                +{match.mentorship_preferences[0].software.length - 3} more
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Specializations */}
                      {match.mentorship_preferences?.[0]?.specializations && match.mentorship_preferences[0].specializations.length > 0 && (
                        <div className="mt-4">
                          <p className="text-xs text-gray-500 mb-1">Expertise:</p>
                          <div className="flex flex-wrap gap-1">
                            {match.mentorship_preferences[0].specializations.slice(0, 3).map((spec: string) => (
                              <span
                                key={spec}
                                className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800"
                              >
                                {spec}
                              </span>
                            ))}
                            {match.mentorship_preferences[0].specializations.length > 3 && (
                              <span className="text-xs text-gray-500">
                                +{match.mentorship_preferences[0].specializations.length - 3} more
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Mentoring Message */}
                      {match.mentorship_preferences?.[0]?.mentoring_message && (
                        <div className="mt-4">
                          <p className="text-xs text-gray-500 mb-1">Message:</p>
                          <p className="text-sm text-gray-700 italic">
                            "{match.mentorship_preferences[0].mentoring_message}"
                          </p>
                        </div>
                      )}


                      {/* Connect Button */}
                      <div className="mt-6">
                        <Link
                          href={`/p/${match.slug || match.id}`}
                          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                        >
                          View Profile & Connect
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="mx-auto h-12 w-12 text-gray-400">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                  </svg>
                </div>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No mentors available yet</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Check back later for new mentorship opportunities.
                </p>
              </div>
            )}
          </>
        )}

        {/* Details Modal */}
        <MentorshipDetailsModal
          isOpen={showDetailsModal}
          onClose={() => setShowDetailsModal(false)}
          preferences={currentPreferences}
          onSave={handleSaveDetails}
          type={modalType}
        />
      </div>
    </div>
  );
}
