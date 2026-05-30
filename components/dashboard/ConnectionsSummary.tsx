'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

interface Profile {
  id: string;
  first_name: string;
  last_name: string;
  headline?: string;
  firm_name?: string;
  slug?: string;
}

interface Connection {
  id: string;
  status: 'pending' | 'accepted' | 'declined';
  requester_profile_id: string;
  recipient_profile_id: string;
  created_at: string;
  stream_channel_id?: string;
  requester_profile: Profile;
  recipient_profile: Profile;
}

type FilterKey = 'all' | 'accepted' | 'pending' | 'declined';

export default function ConnectionsSummary() {
  const [connections, setConnections] = useState<Connection[]>([]);
  const [currentProfileId, setCurrentProfileId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterKey>('all');

  useEffect(() => {
    fetchConnections();
  }, []);

  const fetchConnections = async () => {
    try {
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
    if (!confirm('Remove this connection?')) return;
    const res = await fetch(`/api/connections/${connectionId}/delete`, { method: 'DELETE' });
    if (res.ok) fetchConnections();
  };

  const getOtherProfile = (conn: Connection) =>
    conn.requester_profile_id === currentProfileId ? conn.recipient_profile : conn.requester_profile;

  const isRequester = (conn: Connection) =>
    conn.requester_profile_id === currentProfileId;

  const acceptedCount = connections.filter(c => c.status === 'accepted').length;
  const pendingCount = connections.filter(c => c.status === 'pending').length;
  const declinedCount = connections.filter(c => c.status === 'declined').length;
  const totalCount = connections.length;

  const incomingPending = connections.filter(
    c => c.status === 'pending' && c.recipient_profile_id === currentProfileId
  );

  const filteredConnections = connections.filter((conn) => {
    if (filter === 'all') return true;
    return conn.status === filter;
  });

  const stats = [
    { key: 'all' as FilterKey, label: 'Total', count: totalCount, bg: 'bg-slate-50', text: 'text-slate-900', subText: 'text-slate-500' },
    { key: 'accepted' as FilterKey, label: 'Active', count: acceptedCount, bg: 'bg-emerald-50', text: 'text-emerald-700', subText: 'text-emerald-600' },
    { key: 'pending' as FilterKey, label: 'Pending', count: pendingCount, bg: 'bg-amber-50', text: 'text-amber-700', subText: 'text-amber-600' },
    { key: 'declined' as FilterKey, label: 'Declined', count: declinedCount, bg: 'bg-red-50', text: 'text-red-600', subText: 'text-red-500' },
  ];

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-6 animate-pulse">
        <div className="h-5 bg-slate-200 rounded w-1/3 mb-4"></div>
        <div className="h-16 bg-slate-100 rounded"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-slate-900">My Connections</h2>
        <Link
          href="/connections"
          className="text-sm text-blue-600 hover:text-blue-700 font-medium"
        >
          View All →
        </Link>
      </div>

      {/* Clickable stats */}
      <div className="grid grid-cols-4 gap-2 mb-4">
        {stats.map((s) => (
          <button
            key={s.key}
            onClick={() => setFilter(s.key)}
            className={`rounded-lg p-3 text-center transition-all ${
              filter === s.key
                ? `${s.bg} ring-2 ring-${s.key === 'all' ? 'slate' : s.key === 'accepted' ? 'emerald' : s.key === 'pending' ? 'amber' : 'red'}-400`
                : `${s.bg} hover:opacity-80`
            }`}
          >
            <p className={`text-2xl font-bold ${s.text}`}>{s.count}</p>
            <p className={`text-xs mt-0.5 ${s.subText}`}>{s.label}</p>
          </button>
        ))}
      </div>

      {/* Connection list */}
      {filteredConnections.length > 0 ? (
        <div className="space-y-1.5 max-h-72 overflow-y-auto">
          <AnimatePresence>
            {filteredConnections.slice(0, 5).map((conn) => {
              const other = getOtherProfile(conn);
              const requester = isRequester(conn);
              return (
                <motion.div
                  key={conn.id}
                  layout
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="flex items-center justify-between p-2.5 rounded-lg hover:bg-slate-50 transition-colors gap-2"
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-semibold text-slate-500">
                        {other.first_name[0]}{other.last_name[0]}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <Link
                        href={`/p/${other.slug || other.id}`}
                        className="text-sm font-medium text-slate-900 hover:text-blue-600 truncate block"
                      >
                        {other.first_name} {other.last_name}
                      </Link>
                      <p className="text-[11px] text-slate-400 truncate">
                        {other.firm_name || other.headline || (
                          conn.status === 'pending' ? requester ? 'Awaiting response' : 'Pending your decision'
                        ) : null}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    {conn.status === 'accepted' && (
                      <Link
                        href={`/messages/${conn.id}`}
                        className="px-2.5 py-1 bg-blue-600 text-white text-[11px] font-medium rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap"
                      >
                        💬 Message
                      </Link>
                    )}
                    {conn.status === 'pending' && !requester && (
                      <>
                        <button
                          onClick={() => handleDecision(conn.id, 'accepted')}
                          className="px-2.5 py-1 bg-emerald-600 text-white text-[11px] font-medium rounded-lg hover:bg-emerald-700 transition-colors"
                        >
                          Accept
                        </button>
                        <button
                          onClick={() => handleDecision(conn.id, 'declined')}
                          className="px-2.5 py-1 bg-white text-slate-600 text-[11px] font-medium rounded-lg border border-slate-300 hover:bg-slate-50 transition-colors"
                        >
                          Decline
                        </button>
                      </>
                    )}
                    {conn.status === 'pending' && requester && (
                      <button
                        onClick={() => handleDelete(conn.id)}
                        className="px-2.5 py-1 bg-white text-red-500 text-[11px] font-medium rounded-lg border border-red-200 hover:bg-red-50 transition-colors"
                      >
                        Cancel
                      </button>
                    )}
                    {conn.status === 'declined' && (
                      <button
                        onClick={() => handleDelete(conn.id)}
                        className="px-2.5 py-1 bg-white text-slate-400 text-[11px] font-medium rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
                      >
                        Dismiss
                      </button>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
          {filteredConnections.length > 5 && (
            <Link
              href={`/connections${filter !== 'all' ? '?tab=' + filter : ''}`}
              className="block text-center text-xs text-blue-600 hover:text-blue-700 pt-2"
            >
              View all {filteredConnections.length} connections →
            </Link>
          )}
        </div>
      ) : totalCount === 0 ? (
        <div className="text-center py-4">
          <p className="text-sm text-slate-400 mb-3">
            Connect with other tax pros to grow your network.
          </p>
          <Link
            href="/search"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            Browse Directory
          </Link>
        </div>
      ) : (
        <div className="flex items-center justify-between py-3">
          <p className="text-sm text-slate-400">No {filter} connections</p>
          <button
            onClick={() => setFilter('all')}
            className="text-xs text-blue-600 hover:text-blue-700"
          >
            Show all
          </button>
        </div>
      )}

      {/* Quick actions */}
      {totalCount > 0 && (
        <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100">
          <Link
            href="/search"
            className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Find more
          </Link>
          <span className="text-[11px] text-slate-400">
            {acceptedCount} active · {pendingCount} pending
          </span>
        </div>
      )}
    </div>
  );
}
