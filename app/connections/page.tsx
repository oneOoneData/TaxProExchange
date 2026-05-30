'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

interface Profile {
  id: string;
  first_name: string;
  last_name: string;
  headline: string;
  firm_name?: string;
  slug?: string;
}

interface Connection {
  id: string;
  status: 'pending' | 'accepted' | 'declined';
  requester_profile_id: string;
  recipient_profile_id: string;
  created_at: string;
  requester_profile: Profile;
  recipient_profile: Profile;
}

type TabKey = 'all' | 'pending' | 'accepted' | 'declined';

export default function ConnectionsPage() {
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const [connections, setConnections] = useState<Connection[]>([]);
  const [currentProfileId, setCurrentProfileId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabKey>('all');
  const [searchQuery, setSearchQuery] = useState('');

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
      const res = await fetch('/api/connections/all');
      if (res.ok) {
        const data = await res.json();
        setConnections(data.connections || []);
        setCurrentProfileId(data.currentProfileId);
      }
    } catch (e) {
      console.error('Failed to fetch connections:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleDecision = async (connectionId: string, decision: 'accepted' | 'declined') => {
    const res = await fetch(`/api/connect/${connectionId}/decision`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ decision }),
    });
    if (res.ok) fetchConnections();
  };

  const handleDelete = async (connectionId: string) => {
    if (!confirm('Remove this connection? This cannot be undone.')) return;
    const res = await fetch(`/api/connections/${connectionId}/delete`, {
      method: 'DELETE',
    });
    if (res.ok) fetchConnections();
  };

  const getOtherProfile = (conn: Connection) =>
    conn.requester_profile_id === currentProfileId ? conn.recipient_profile : conn.requester_profile;

  const isRequester = (conn: Connection) =>
    conn.requester_profile_id === currentProfileId;

  const filteredConnections = connections.filter((conn) => {
    const other = getOtherProfile(conn);
    const nameMatch = searchQuery
      ? `${other.first_name} ${other.last_name}`.toLowerCase().includes(searchQuery.toLowerCase())
      : true;
    if (!nameMatch) return false;
    if (activeTab === 'all') return true;
    return conn.status === activeTab;
  });

  const tabs: { key: TabKey; label: string; count: number; color: string }[] = [
    { key: 'all', label: 'All', count: connections.length, color: 'blue' },
    { key: 'pending', label: 'Pending', count: connections.filter(c => c.status === 'pending').length, color: 'amber' },
    { key: 'accepted', label: 'Connected', count: connections.filter(c => c.status === 'accepted').length, color: 'emerald' },
    { key: 'declined', label: 'Declined', count: connections.filter(c => c.status === 'declined').length, color: 'red' },
  ];

  if (!isLoaded || !user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-slate-50">
      <div className="mx-auto max-w-4xl px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-semibold text-slate-900 mb-2">My Connections</h1>
          <p className="text-slate-600">
            Manage your professional network — pending requests, active connections, and more.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-3 mb-6">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={`rounded-xl border p-4 text-center transition-all ${
                activeTab === t.key
                  ? `bg-${t.color}-50 border-${t.color}-200 shadow-sm`
                  : 'bg-white border-slate-200 hover:border-slate-300'
              }`}
            >
              <p className={`text-2xl font-bold ${
                activeTab === t.key ? `text-${t.color}-700` : 'text-slate-900'
              }`}>{t.count}</p>
              <p className={`text-xs mt-0.5 ${
                activeTab === t.key ? `text-${t.color}-600 font-medium` : 'text-slate-500'
              }`}>{t.label}</p>
            </button>
          ))}
        </div>

        {/* Search + Actions */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <Link
            href="/search"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Find New Connections
          </Link>
        </div>

        {/* Connections List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900 mx-auto"></div>
            <p className="mt-2 text-slate-600">Loading connections...</p>
          </div>
        ) : filteredConnections.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-slate-900 mb-2">
              {activeTab === 'all' && 'No connections yet'}
              {activeTab === 'pending' && 'No pending requests'}
              {activeTab === 'accepted' && 'No active connections'}
              {activeTab === 'declined' && 'No declined connections'}
            </h3>
            <p className="text-slate-500 mb-6 max-w-sm mx-auto">
              {activeTab === 'all'
                ? 'Connect with other tax professionals to grow your network.'
                : activeTab === 'pending'
                ? 'You don\'t have any pending connection requests right now.'
                : activeTab === 'accepted'
                ? 'Start connecting with tax pros to build your bench.'
                : 'No declined connections to show.'}
            </p>
            <Link
              href="/search"
              className="inline-flex items-center px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Browse Directory
            </Link>
          </div>
        ) : (
          <AnimatePresence>
            <div className="space-y-3">
              {filteredConnections.map((conn) => {
                const other = getOtherProfile(conn);
                const requester = isRequester(conn);
                return (
                  <motion.div
                    key={conn.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="bg-white rounded-xl border border-slate-200 p-4 hover:shadow-sm transition-shadow"
                  >
                    <div className="flex items-start justify-between gap-4">
                      {/* Left: Profile info */}
                      <div className="flex items-start gap-3 min-w-0 flex-1">
                        <div className="w-11 h-11 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0">
                          <span className="text-sm font-semibold text-slate-600">
                            {other.first_name[0]}{other.last_name[0]}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <Link
                            href={`/p/${other.slug || other.id}`}
                            className="text-sm font-semibold text-slate-900 hover:text-blue-600 transition-colors"
                          >
                            {other.first_name} {other.last_name}
                          </Link>
                          {other.headline && (
                            <p className="text-xs text-slate-500 truncate">{other.headline}</p>
                          )}
                          {other.firm_name && (
                            <p className="text-xs text-slate-400">{other.firm_name}</p>
                          )}
                          <div className="flex flex-wrap gap-1.5 mt-1.5">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${
                              conn.status === 'accepted'
                                ? 'bg-emerald-100 text-emerald-700'
                                : conn.status === 'pending'
                                ? 'bg-amber-100 text-amber-700'
                                : 'bg-red-100 text-red-700'
                            }`}>
                              {conn.status === 'accepted' ? '✅ Connected' : conn.status === 'pending' ? '⏳ Pending' : '❌ Declined'}
                            </span>
                            {conn.status === 'accepted' && (
                              <span className="text-[10px] text-slate-400">
                                Since {new Date(conn.created_at).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right: Actions */}
                      <div className="flex gap-1.5 shrink-0">
                        {conn.status === 'pending' && !requester && (
                          <>
                            <button
                              onClick={() => handleDecision(conn.id, 'accepted')}
                              className="px-3 py-1.5 bg-emerald-600 text-white text-xs font-medium rounded-lg hover:bg-emerald-700 transition-colors"
                            >
                              Accept
                            </button>
                            <button
                              onClick={() => handleDecision(conn.id, 'declined')}
                              className="px-3 py-1.5 bg-white text-slate-600 text-xs font-medium rounded-lg border border-slate-300 hover:bg-slate-50 transition-colors"
                            >
                              Decline
                            </button>
                          </>
                        )}
                        {conn.status === 'pending' && requester && (
                          <>
                            <span className="text-xs text-slate-400 px-2 py-1.5">Awaiting response</span>
                            <button
                              onClick={() => handleDelete(conn.id)}
                              className="px-3 py-1.5 bg-white text-red-600 text-xs font-medium rounded-lg border border-red-200 hover:bg-red-50 transition-colors"
                            >
                              Cancel
                            </button>
                          </>
                        )}
                        {conn.status === 'accepted' && (
                          <>
                            <Link
                              href={`/messages/${conn.id}`}
                              className="px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 transition-colors"
                            >
                              💬 Message
                            </Link>
                            <button
                              onClick={() => handleDelete(conn.id)}
                              className="px-3 py-1.5 bg-white text-red-600 text-xs font-medium rounded-lg border border-red-200 hover:bg-red-50 transition-colors"
                            >
                              Remove
                            </button>
                          </>
                        )}
                        {conn.status === 'declined' && (
                          <button
                            onClick={() => handleDelete(conn.id)}
                            className="px-3 py-1.5 bg-white text-slate-500 text-xs font-medium rounded-lg border border-slate-300 hover:bg-slate-50 transition-colors"
                          >
                            Dismiss
                          </button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
