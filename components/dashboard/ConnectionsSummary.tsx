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
  requester_profile: Profile;
  recipient_profile: Profile;
}

export default function ConnectionsSummary() {
  const [connections, setConnections] = useState<Connection[]>([]);
  const [currentProfileId, setCurrentProfileId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

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

  // Pending where current user is the recipient (incoming requests they need to act on)
  const incomingPending = connections.filter(
    c => c.status === 'pending' && c.recipient_profile_id === currentProfileId
  );

  // Total accepted
  const acceptedCount = connections.filter(c => c.status === 'accepted').length;
  const totalCount = connections.length;

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

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="bg-slate-50 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-slate-900">{totalCount}</p>
          <p className="text-xs text-slate-500">Total</p>
        </div>
        <div className="bg-emerald-50 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-emerald-700">{acceptedCount}</p>
          <p className="text-xs text-emerald-600">Active</p>
        </div>
        <div className="bg-amber-50 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-amber-700">{incomingPending.length}</p>
          <p className="text-xs text-amber-600">Pending</p>
        </div>
      </div>

      {/* Incoming pending requests */}
      <AnimatePresence>
        {incomingPending.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            className="space-y-2"
          >
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Incoming Requests
            </p>
            {incomingPending.slice(0, 3).map((conn) => {
              const requester = conn.requester_profile;
              return (
                <motion.div
                  key={conn.id}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center justify-between p-3 rounded-lg bg-amber-50 border border-amber-100"
                >
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/p/${requester.slug || requester.id}`}
                      className="text-sm font-medium text-slate-900 hover:text-blue-600"
                    >
                      {requester.first_name} {requester.last_name}
                    </Link>
                    {requester.firm_name && (
                      <p className="text-xs text-slate-500 truncate">{requester.firm_name}</p>
                    )}
                  </div>
                  <div className="flex gap-1.5 ml-3 shrink-0">
                    <button
                      onClick={() => handleDecision(conn.id, 'accepted')}
                      className="px-3 py-1 bg-emerald-600 text-white text-xs font-medium rounded-lg hover:bg-emerald-700 transition-colors"
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => handleDecision(conn.id, 'declined')}
                      className="px-3 py-1 bg-white text-slate-600 text-xs font-medium rounded-lg border border-slate-300 hover:bg-slate-50 transition-colors"
                    >
                      Decline
                    </button>
                  </div>
                </motion.div>
              );
            })}
            {incomingPending.length > 3 && (
              <Link
                href="/messages?tab=pending"
                className="block text-center text-xs text-blue-600 hover:text-blue-700 pt-1"
              >
                +{incomingPending.length - 3} more pending requests
              </Link>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {totalCount === 0 && (
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
      )}

      {totalCount > 0 && incomingPending.length === 0 && (
        <div className="text-center pt-2">
          <Link
            href="/search"
            className="text-xs text-blue-600 hover:text-blue-700"
          >
            Find more tax pros to connect with →
          </Link>
        </div>
      )}
    </div>
  );
}
