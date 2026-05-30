'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import Logo from '@/components/Logo';
import UserMenu from '@/components/UserMenu';

export const dynamic = 'force-dynamic';

interface Profile {
  id: string;
  first_name: string;
  last_name: string;
  headline?: string;
  firm_name?: string;
  avatar_url?: string;
  slug?: string;
}

interface Connection {
  id: string;
  status?: string;
  requester_profile_id: string;
  recipient_profile_id: string;
  created_at: string;
  stream_channel_id?: string;
  requester_profile: Profile;
  recipient_profile: Profile;
}

export default function MessagesPage() {
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const [connections, setConnections] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentProfileId, setCurrentProfileId] = useState<string | null>(null);

  useEffect(() => {
    if (isLoaded && !user) {
      router.push('/sign-in');
      return;
    }
    if (user) fetchConnections();
  }, [isLoaded, user, router]);

  const fetchConnections = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/connections/all');
      if (response.ok) {
        const data = await response.json();
        setConnections(data.connections || []);
        setCurrentProfileId(data.currentProfileId);
      }
    } catch (e) {
      console.error('Failed to fetch connections:', e);
    } finally {
      setLoading(false);
    }
  };

  const getOtherProfile = (conn: Connection) =>
    conn.requester_profile_id === currentProfileId ? conn.recipient_profile : conn.requester_profile;

  // Only show accepted connections with a Stream channel (active chats)
  const activeChats = connections.filter((c) => c.status === 'accepted' && c.stream_channel_id);

  if (!isLoaded || !user) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900 mx-auto" />
          <p className="mt-2 text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-slate-50">
      {/* Header */}
      <header className="sticky top-0 z-30 backdrop-blur bg-white/70 border-b border-slate-200">
        <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
          <Logo />
          <nav className="hidden md:flex items-center gap-6 text-sm text-slate-600">
            <Link href="/" className="hover:text-slate-900">Home</Link>
            <Link href="/search" className="hover:text-slate-900">Search</Link>
            <Link href="/jobs" className="hover:text-slate-900">Jobs</Link>
          </nav>
          <div className="flex items-center gap-4">
            <Link
              href="/feedback"
              className="relative p-2 text-slate-600 hover:text-slate-900 transition-colors"
              aria-label="Feedback"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </Link>
            <Link
              href="/messages"
              className="relative p-2 text-blue-600 transition-colors"
              aria-label="Messages"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </Link>
            <UserMenu
              userName={user.fullName || undefined}
              userEmail={user.primaryEmailAddress?.emailAddress}
            />
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold text-slate-900 mb-2">Messages</h1>
          <p className="text-slate-600 mb-6">Chat with your accepted connections.</p>

          {/* Quick links */}
          <div className="flex items-center gap-3">
            <Link
              href="/connections"
              className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-200 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Manage Connections
            </Link>
            <Link
              href="/search"
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              Find Pros
            </Link>
          </div>
        </div>

        {/* Chat List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900 mx-auto" />
            <p className="mt-2 text-slate-600">Loading conversations...</p>
          </div>
        ) : activeChats.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-slate-900 mb-2">No messages yet</h3>
            <p className="text-slate-500 mb-6 max-w-sm mx-auto">
              Connect with tax professionals first, then start messaging once they accept.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/search"
                className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Browse Directory
              </Link>
              <Link
                href="/connections"
                className="px-5 py-2.5 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-medium"
              >
                View Pending Requests
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {activeChats.map((conn) => {
              const other = getOtherProfile(conn);
              return (
                <Link
                  key={conn.id}
                  href={`/messages/${conn.id}`}
                  className="block p-4 bg-white rounded-xl border border-slate-200 hover:border-blue-200 hover:shadow-sm transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-semibold text-blue-700">
                        {other.first_name[0]}{other.last_name[0]}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-slate-900">
                        {other.first_name} {other.last_name}
                      </p>
                      <p className="text-xs text-slate-400 truncate">
                        {other.headline || other.firm_name || 'Tax Professional'}
                      </p>
                    </div>
                    <svg className="w-4 h-4 text-slate-300 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
