'use client';

import Link from 'next/link';
import { Connection, RecentlyVerifiedProfile, getConnectionDisplayName, getConnectionStatusText, getConnectionStatusColor, formatRelativeTime } from '@/lib/db/activity';
import { useEffect, useState } from 'react';

interface NewMentor {
  id: string;
  first_name: string;
  last_name: string;
  headline?: string;
  firm_name?: string;
  credential_type: string;
  slug?: string;
  avatar_url?: string;
  updated_at: string;
  topics: string[];
  software: string[];
  specializations: string[];
  mentoring_message?: string;
}

interface ActivityFeedProps {
  connections: Connection[];
  recentlyVerified: RecentlyVerifiedProfile[];
  currentProfileId: string;
}

export default function ActivityFeed({ connections, recentlyVerified, currentProfileId }: ActivityFeedProps) {
  const [newMentors, setNewMentors] = useState<NewMentor[]>([]);
  const [isLoadingMentors, setIsLoadingMentors] = useState(false);

  useEffect(() => {
    fetchNewMentors();
  }, []);

  const fetchNewMentors = async () => {
    setIsLoadingMentors(true);
    try {
      const response = await fetch('/api/dashboard/new-mentors');
      if (response.ok) {
        const data = await response.json();
        setNewMentors(data.newMentors || []);
      } else {
        console.error('Failed to fetch new mentors');
      }
    } catch (error) {
      console.error('Error fetching new mentors:', error);
    } finally {
      setIsLoadingMentors(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">Activity</h2>
      
      <div className="space-y-8">
        {/* New Mentors */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">New Mentors</h3>
          
          {isLoadingMentors ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="p-3 bg-gray-50 rounded-lg animate-pulse">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : newMentors.length === 0 ? (
            <div className="text-center py-8">
              <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
              <p className="text-sm text-gray-500 mb-2">No new mentors this week</p>
              <p className="text-xs text-gray-400">Check back later for new mentoring opportunities</p>
            </div>
          ) : (
            <div className="space-y-3">
              {newMentors.slice(0, 5).map((mentor) => (
                <Link
                  key={mentor.id}
                  href={mentor.slug ? `/p/${mentor.slug}` : `/p/${mentor.id}`}
                  className="block p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    {mentor.avatar_url ? (
                      <img
                        src={mentor.avatar_url}
                        alt={`${mentor.first_name} ${mentor.last_name}`}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-gray-600">
                          {mentor.first_name[0]}{mentor.last_name[0]}
                        </span>
                      </div>
                    )}
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {mentor.first_name} {mentor.last_name}
                        </p>
                        <span className="text-xs text-gray-400">
                          {formatRelativeTime(mentor.updated_at)}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2 mb-2">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          {mentor.credential_type}
                        </span>
                        {mentor.firm_name && (
                          <span className="text-xs text-gray-500 truncate">
                            {mentor.firm_name}
                          </span>
                        )}
                      </div>
                      
                      {mentor.mentoring_message && (
                        <p className="text-xs text-gray-600 italic line-clamp-2">
                          "{mentor.mentoring_message}"
                        </p>
                      )}
                      
                      {(mentor.topics.length > 0 || mentor.software.length > 0 || mentor.specializations.length > 0) && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {mentor.topics.slice(0, 2).map((topic) => (
                            <span
                              key={topic}
                              className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                            >
                              {topic.replace(/_/g, ' ').toUpperCase()}
                            </span>
                          ))}
                          {mentor.software.slice(0, 1).map((soft) => (
                            <span
                              key={soft}
                              className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800"
                            >
                              {soft.replace(/_/g, ' ')}
                            </span>
                          ))}
                          {mentor.specializations.slice(0, 1).map((spec) => (
                            <span
                              key={spec}
                              className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800"
                            >
                              {spec}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
              
              {newMentors.length > 5 && (
                <Link
                  href="/mentorship"
                  className="block text-center text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  View all new mentors ({newMentors.length})
                </Link>
              )}
            </div>
          )}
        </div>

        {/* Newly Verified Pros */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Newly Verified Pros</h3>
          
          {recentlyVerified.length === 0 ? (
            <div className="text-center py-8">
              <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm text-gray-500 mb-2">No recent verifications</p>
              <p className="text-xs text-gray-400">Check back later for new verified professionals</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentlyVerified.slice(0, 5).map((profile) => (
                <Link
                  key={profile.id}
                  href={profile.slug ? `/p/${profile.slug}` : '#'}
                  className="block p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {profile.first_name} {profile.last_name}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {profile.credential_type}
                        </span>
                        {profile.firm_name && (
                          <span className="text-xs text-gray-500 truncate">
                            {profile.firm_name}
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="text-xs text-gray-400">
                      {formatRelativeTime(profile.updated_at)}
                    </span>
                  </div>
                </Link>
              ))}
              
              {recentlyVerified.length > 5 && (
                <Link
                  href="/search"
                  className="block text-center text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  View all verified pros
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
