'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import Logo from '@/components/Logo';
import UserMenu from '@/components/UserMenu';

export const dynamic = 'force-dynamic';

interface Connection {
  id: string;
  status: 'pending' | 'accepted' | 'declined';
  requester_profile_id: string;
  recipient_profile_id: string;
  created_at: string;
  stream_channel_id?: string;
}

interface Profile {
  id: string;
  first_name: string;
  last_name: string;
  headline: string;
  firm_name?: string;
  public_email: string;
  avatar_url?: string;
}

interface ConnectionWithProfiles extends Connection {
  requester_profile: Profile;
  recipient_profile: Profile;
}

export default function ChatThreadPage() {
  const router = useRouter();
  const params = useParams();
  const { user, isLoaded } = useUser();
  const [connection, setConnection] = useState<ConnectionWithProfiles | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentProfileId, setCurrentProfileId] = useState<string | null>(null);

  const connectionId = params.connectionId as string;

  useEffect(() => {
    if (isLoaded && !user) {
      router.push('/sign-in');
      return;
    }
    
    if (user && connectionId) {
      fetchConnection();
    }
  }, [isLoaded, user, connectionId, router]);

  const fetchConnection = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/stream/connection/${connectionId}`);
      
      if (response.ok) {
        const data = await response.json();
        setConnection(data.connection);
        setCurrentProfileId(data.currentProfileId);
      } else {
        console.error('Failed to fetch connection');
        // Redirect to messages if connection not found
        router.push('/messages');
      }
    } catch (error) {
      console.error('Error fetching connection:', error);
      router.push('/messages');
    } finally {
      setLoading(false);
    }
  };

  const getOtherProfile = () => {
    if (!connection || !currentProfileId) return null;
    return connection.requester_profile_id === currentProfileId 
      ? connection.recipient_profile 
      : connection.requester_profile;
  };

  if (!isLoaded || !user) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900 mx-auto"></div>
          <p className="mt-2 text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900 mx-auto"></div>
          <p className="mt-2 text-slate-600">Loading chat...</p>
        </div>
      </div>
    );
  }

  if (!connection || connection.status !== 'accepted') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-slate-50">
        <header className="sticky top-0 z-30 backdrop-blur bg-white/70 border-b border-slate-200">
          <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
            <Logo />
            <nav className="hidden md:flex items-center gap-6 text-sm text-slate-600">
              <Link href="/" className="hover:text-slate-900">Home</Link>
              <Link href="/search" className="hover:text-slate-900">Search</Link>
              <Link href="/jobs" className="hover:text-slate-900">Jobs</Link>
              <Link href="/messages" className="hover:text-slate-900 font-medium">Messages</Link>
            </nav>
            <UserMenu 
              userName={user.fullName || undefined}
              userEmail={user.primaryEmailAddress?.emailAddress}
            />
          </div>
        </header>

        <div className="mx-auto max-w-4xl px-4 py-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-slate-900 mb-2">Connection Not Found</h3>
          <p className="text-slate-600 mb-4">
            This connection doesn't exist or you don't have permission to access it.
          </p>
          <Link
            href="/messages"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Back to Messages
          </Link>
        </div>
      </div>
    );
  }

  const otherProfile = getOtherProfile();

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
          <UserMenu 
            userName={user.fullName || undefined}
            userEmail={user.primaryEmailAddress?.emailAddress}
          />
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-4 py-8">
        {/* Chat Header */}
        <div className="mb-6">
          <div className="flex items-center gap-4 mb-4">
            <Link
              href="/messages"
              className="text-slate-600 hover:text-slate-900 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center">
                <span className="text-sm font-semibold text-slate-600">
                  {otherProfile?.first_name[0]}{otherProfile?.last_name[0]}
                </span>
              </div>
              <div>
                <h1 className="text-xl font-semibold text-slate-900">
                  {otherProfile?.first_name} {otherProfile?.last_name}
                </h1>
                <p className="text-slate-600 text-sm">{otherProfile?.headline}</p>
                {otherProfile?.firm_name && (
                  <p className="text-slate-500 text-xs">{otherProfile.firm_name}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Chat Interface Placeholder */}
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-slate-900 mb-2">Chat Interface Coming Soon</h3>
          <p className="text-slate-600 mb-4">
            The Stream Chat integration is being set up. You'll be able to send messages here soon!
          </p>
          <div className="text-sm text-slate-500">
            <p>Connection ID: {connection.id}</p>
            {connection.stream_channel_id && (
              <p>Stream Channel: {connection.stream_channel_id}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
