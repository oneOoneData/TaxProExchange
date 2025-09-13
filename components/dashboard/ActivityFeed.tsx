import Link from 'next/link';
import { Connection, RecentlyVerifiedProfile, getConnectionDisplayName, getConnectionStatusText, getConnectionStatusColor, formatRelativeTime } from '@/lib/db/activity';

interface ActivityFeedProps {
  connections: Connection[];
  recentlyVerified: RecentlyVerifiedProfile[];
  currentProfileId: string;
}

export default function ActivityFeed({ connections, recentlyVerified, currentProfileId }: ActivityFeedProps) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">Activity</h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Connections */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Your Connections</h3>
          
          {connections.length === 0 ? (
            <div className="text-center py-8">
              <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <p className="text-sm text-gray-500 mb-2">No connections yet</p>
              <p className="text-xs text-gray-400">Start connecting with other tax professionals</p>
            </div>
          ) : (
            <div className="space-y-3">
              {connections.slice(0, 5).map((connection) => {
                const displayName = getConnectionDisplayName(connection, currentProfileId);
                const statusText = getConnectionStatusText(connection.status);
                const statusColor = getConnectionStatusColor(connection.status);
                
                return (
                  <div key={connection.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {displayName}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatRelativeTime(connection.created_at)}
                      </p>
                    </div>
                    <span className={`text-xs font-medium ${statusColor}`}>
                      {statusText}
                    </span>
                  </div>
                );
              })}
              
              {connections.length > 5 && (
                <Link
                  href="/messages"
                  className="block text-center text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  View all connections ({connections.length})
                </Link>
              )}
            </div>
          )}
        </div>

        {/* Recently Verified */}
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
