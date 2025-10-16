'use client';

import Link from 'next/link';
import Card from '@/components/ui/Card';
import { useEffect, useState } from 'react';

interface MessageThread {
  id: string;
  counterpartName: string;
  counterpartAvatar?: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
}

interface MessagesPreviewProps {
  threads?: MessageThread[];
  unreadTotal?: number;
}

export default function MessagesPreview({ threads = [], unreadTotal = 0 }: MessagesPreviewProps) {
  const [actualUnreadCount, setActualUnreadCount] = useState(unreadTotal);
  const [messageThreads, setMessageThreads] = useState<MessageThread[]>(threads);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const response = await fetch('/api/messages/unread');
        if (response.ok) {
          const data = await response.json();
          setActualUnreadCount(data.unreadCount || 0);
          
          // Format threads with relative time
          if (data.threads && data.threads.length > 0) {
            const formattedThreads = data.threads.map((thread: any) => ({
              ...thread,
              lastMessageTime: formatRelativeTime(thread.lastMessageTime)
            }));
            setMessageThreads(formattedThreads);
          } else {
            setMessageThreads([]);
          }
        }
      } catch (error) {
        console.error('Failed to fetch messages:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMessages();
    
    // Poll every 30 seconds for updates
    const interval = setInterval(fetchMessages, 30000);
    return () => clearInterval(interval);
  }, []);

  const displayUnreadCount = actualUnreadCount;

  // Helper to format relative time
  function formatRelativeTime(timestamp: string): string {
    const now = new Date();
    const messageTime = new Date(timestamp);
    const diffMs = now.getTime() - messageTime.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return messageTime.toLocaleDateString();
  }

  return (
    <Card 
      title="Messages" 
      description={
        isLoading 
          ? 'Loading...' 
          : displayUnreadCount > 0 
            ? `You have ${displayUnreadCount} unread message${displayUnreadCount > 1 ? 's' : ''}` 
            : 'No unread messages'
      }
      action={
        <Link 
          href="/messages"
          className="text-sm text-blue-600 hover:text-blue-700 font-medium"
        >
          Open Messages
        </Link>
      }
    >
      {messageThreads.length === 0 ? (
        <div className="text-center py-6">
          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <h4 className="font-medium text-gray-900 mb-1">No messages yet</h4>
          <p className="text-sm text-gray-600 mb-3">Start by saying hi to 2 nearby pros.</p>
          <Link
            href="/search"
            className="inline-flex items-center px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            Browse Directory
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {messageThreads.slice(0, 3).map((thread) => (
            <Link
              key={thread.id}
              href={`/messages/${thread.id}`}
              className="block p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  {thread.counterpartAvatar ? (
                    <img
                      src={thread.counterpartAvatar}
                      alt={thread.counterpartName}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                      <span className="text-xs font-medium text-gray-600">
                        {thread.counterpartName.split(' ').map(n => n[0]).join('')}
                      </span>
                    </div>
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="text-sm font-medium text-gray-900 truncate">
                      {thread.counterpartName}
                    </h4>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">{thread.lastMessageTime}</span>
                      {thread.unreadCount > 0 && (
                        <span className="inline-flex items-center justify-center w-5 h-5 bg-blue-600 text-white text-xs font-medium rounded-full">
                          {thread.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <p className="text-sm text-gray-600 truncate">
                    {thread.lastMessage}
                  </p>
                </div>
              </div>
            </Link>
          ))}
          
          {messageThreads.length > 3 && (
            <div className="text-center pt-2">
              <Link
                href="/messages"
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                View {messageThreads.length - 3} more conversations
              </Link>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
