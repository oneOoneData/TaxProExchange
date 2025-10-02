import Link from 'next/link';
import { Connection, RecentlyVerifiedProfile, RecentMessage, getConnectionDisplayName, getConnectionStatusText, getConnectionStatusColor, getMessageOtherPersonName, formatRelativeTime } from '@/lib/db/activity';

interface ActivityFeedProps {
  connections: Connection[];
  recentlyVerified: RecentlyVerifiedProfile[];
  recentMessages: RecentMessage[];
  currentProfileId: string;
}

export default function ActivityFeed({ connections, recentlyVerified, recentMessages, currentProfileId }: ActivityFeedProps) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">Activity</h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Messages */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Messages</h3>
          
          {recentMessages.length === 0 ? (
            <div className="text-center py-8">
              <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <p className="text-sm text-gray-500 mb-2">No recent messages</p>
              <p className="text-xs text-gray-400">Start conversations with your connections</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentMessages.slice(0, 5).map((message) => {
                const otherPersonName = getMessageOtherPersonName(message, currentProfileId);
                const isFromCurrentUser = message.sender_profile_id === currentProfileId;
                
                return (
                  <div key={message.id} className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {otherPersonName}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatRelativeTime(message.created_at)}
                        </p>
                      </div>
                      <Link
                        href={`/messages/${message.connection_id}`}
                        className="ml-2 px-3 py-1 bg-blue-600 text-white text-xs font-medium rounded-full hover:bg-blue-700 transition-colors"
                      >
                        Chat
                      </Link>
                    </div>
                    <p className="text-sm text-gray-700 line-clamp-2">
                      {isFromCurrentUser ? 'You: ' : ''}{message.content}
                    </p>
                  </div>
                );
              })}
              
              {recentMessages.length > 5 && (
                <Link
                  href="/messages"
                  className="block text-center text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  View all messages ({recentMessages.length})
                </Link>
              )}
            </div>
          )}
        </div>

        {/* Connections or Recently Verified */}
        <div>
          {recentMessages.length === 0 && connections.length > 0 ? (
            <>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Your Connections</h3>
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
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-medium ${statusColor}`}>
                          {statusText}
                        </span>
                        {connection.status === 'accepted' && (
                          <Link
                            href={`/messages/${connection.id}`}
                            className="px-3 py-1 bg-blue-600 text-white text-xs font-medium rounded-full hover:bg-blue-700 transition-colors"
                          >
                            Chat
                          </Link>
                        )}
                      </div>
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
            </>
          ) : (
            <>
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
            </>
          )}
        </div>
      </div>
    </div>
  );
}
