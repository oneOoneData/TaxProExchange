'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
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

export default function MessagesPage() {
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const [connections, setConnections] = useState<ConnectionWithProfiles[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'active'>('all');
  const [currentProfileId, setCurrentProfileId] = useState<string | null>(null);

  useEffect(() => {
    if (isLoaded && !user) {
      router.push('/sign-in');
      return;
    }
    
    if (user) {
      fetchConnections();
    }
  }, [isLoaded, user, router]);

  const fetchConnections = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/connections/all');
      
      if (response.ok) {
        const data = await response.json();
        setConnections(data.connections || []);
        setCurrentProfileId(data.currentProfileId);
      } else {
        console.error('Failed to fetch connections');
      }
    } catch (error) {
      console.error('Error fetching connections:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConnectionDecision = async (connectionId: string, decision: 'accepted' | 'declined') => {
    try {
      const response = await fetch(`/api/connect/${connectionId}/decision`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decision })
      });

      if (response.ok) {
        // Refresh connections after decision
        await fetchConnections();
      } else {
        console.error('Failed to update connection');
      }
    } catch (error) {
      console.error('Error updating connection:', error);
    }
  };

  const handleDeleteConnection = async (connectionId: string) => {
    if (!confirm('Are you sure you want to delete this connection? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/connections/${connectionId}/delete`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.ok) {
        // Refresh connections after deletion
        await fetchConnections();
      } else {
        const errorData = await response.json();
        console.error('Failed to delete connection:', errorData.error);
        alert('Failed to delete connection. Please try again.');
      }
    } catch (error) {
      console.error('Error deleting connection:', error);
      alert('Failed to delete connection. Please try again.');
    }
  };

  const getCurrentUserProfile = (connection: ConnectionWithProfiles) => {
    if (!currentProfileId) return connection.requester_profile;
    return connection.requester_profile_id === currentProfileId 
      ? connection.requester_profile 
      : connection.recipient_profile;
  };

  const getOtherProfile = (connection: ConnectionWithProfiles) => {
    if (!currentProfileId) return connection.recipient_profile;
    return connection.requester_profile_id === currentProfileId 
      ? connection.recipient_profile 
      : connection.requester_profile;
  };

  const getFilteredConnections = () => {
    switch (activeTab) {
      case 'pending':
        return connections.filter(conn => conn.status === 'pending');
      case 'active':
        return connections.filter(conn => conn.status === 'accepted');
      default:
        return connections;
    }
  };

  const renderConnectionCard = (connection: ConnectionWithProfiles, index: number) => {
    const otherProfile = getOtherProfile(connection);
    const isRequester = currentProfileId ? connection.requester_profile_id === currentProfileId : false;

    return (
      <motion.div
        key={connection.id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: index * 0.1 }}
        className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-md transition-shadow"
      >
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center">
                <span className="text-lg font-semibold text-slate-600">
                  {otherProfile.first_name[0]}{otherProfile.last_name[0]}
                </span>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900">
                  {otherProfile.first_name} {otherProfile.last_name}
                </h3>
                <p className="text-slate-600 text-sm">{otherProfile.headline}</p>
                {otherProfile.firm_name && (
                  <p className="text-slate-500 text-xs">{otherProfile.firm_name}</p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 mb-4">
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                connection.status === 'pending' 
                  ? 'bg-yellow-100 text-yellow-700' 
                  : connection.status === 'accepted'
                  ? 'bg-green-100 text-green-700'
                  : 'bg-red-100 text-red-700'
              }`}>
                {connection.status === 'pending' ? 'Pending' : 
                 connection.status === 'accepted' ? 'Connected' : 'Declined'}
              </span>
              <span className="text-xs text-slate-500">
                {isRequester ? 'You requested' : 'Requested you'}
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-2 ml-4">
            {connection.status === 'pending' && !isRequester && (
              <div className="flex gap-2">
                <button
                  onClick={() => handleConnectionDecision(connection.id, 'accepted')}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                >
                  Accept
                </button>
                <button
                  onClick={() => handleConnectionDecision(connection.id, 'declined')}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
                >
                  Decline
                </button>
                <button
                  onClick={() => handleDeleteConnection(connection.id)}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm font-medium"
                >
                  Delete
                </button>
              </div>
            )}

            {connection.status === 'pending' && isRequester && (
              <div className="flex gap-2">
                <span className="text-sm text-slate-500 px-4 py-2">
                  Waiting for response
                </span>
                <button
                  onClick={() => handleDeleteConnection(connection.id)}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm font-medium"
                >
                  Cancel
                </button>
              </div>
            )}

            {connection.status === 'accepted' && (
              <div className="flex gap-2">
                <Link
                  href={`/messages/${connection.id}`}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                >
                  Message
                </Link>
                <button
                  onClick={() => handleDeleteConnection(connection.id)}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm font-medium"
                >
                  Delete
                </button>
              </div>
            )}

            {connection.status === 'declined' && (
              <div className="flex gap-2">
                <span className="text-sm text-slate-500 px-4 py-2">
                  Connection declined
                </span>
                <button
                  onClick={() => handleDeleteConnection(connection.id)}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm font-medium"
                >
                  Remove
                </button>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    );
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

  const filteredConnections = getFilteredConnections();

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
        <div className="mb-8">
          <h1 className="text-3xl font-semibold text-slate-900 mb-2">Messages</h1>
          <p className="text-slate-600">Manage your professional connections and communications.</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-slate-100 rounded-lg p-1 mb-6">
          {[
            { key: 'all', label: 'All', count: connections.length },
            { key: 'pending', label: 'Pending', count: connections.filter(c => c.status === 'pending').length },
            { key: 'active', label: 'Active', count: connections.filter(c => c.status === 'accepted').length }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === tab.key
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.label}
              <span className="ml-2 text-xs bg-slate-200 text-slate-600 px-2 py-1 rounded-full">
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900 mx-auto"></div>
            <p className="mt-2 text-slate-600">Loading connections...</p>
          </div>
        ) : filteredConnections.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-slate-900 mb-2">No connections yet</h3>
            <p className="text-slate-600 mb-4">
              {activeTab === 'pending' 
                ? 'No pending connection requests.'
                : activeTab === 'active'
                ? 'No active connections yet.'
                : 'Start connecting with other tax professionals to see messages here.'
              }
            </p>
            <Link
              href="/search"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Find Professionals
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredConnections.map((connection, index) => 
              renderConnectionCard(connection, index)
            )}
          </div>
        )}
      </div>
    </div>
  );
}
