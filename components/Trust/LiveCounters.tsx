'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface StatsData {
  verifiedProfiles: number;
  statesCovered: number;
  credentialCounts: {
    cpa: number;
    ea: number;
    ctec: number;
    attorney: number;
  };
  lastUpdated: string;
}

export default function LiveCounters() {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchStats() {
      try {
        const response = await fetch('/api/trust/stats');
        if (!response.ok) {
          throw new Error('Failed to fetch stats');
        }
        const data = await response.json();
        setStats(data);
      } catch (err) {
        console.error('Error fetching trust stats:', err);
        setError('Unable to load statistics');
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl p-8 border border-slate-200">
        <div className="animate-pulse">
          <div className="h-8 bg-slate-300 rounded w-48 mb-4"></div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="text-center">
                <div className="h-12 bg-slate-300 rounded w-16 mx-auto mb-2"></div>
                <div className="h-4 bg-slate-300 rounded w-24 mx-auto"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="bg-slate-50 rounded-2xl p-8 border border-slate-200">
        <p className="text-slate-600 text-center">
          {error || 'Statistics temporarily unavailable'}
        </p>
      </div>
    );
  }

  const counters = [
    {
      label: 'Verified Professionals',
      value: stats.verifiedProfiles,
      icon: '✓',
      color: 'text-green-600',
    },
    {
      label: 'States Covered',
      value: stats.statesCovered,
      icon: '🗺️',
      color: 'text-blue-600',
    },
    {
      label: 'CPAs',
      value: stats.credentialCounts.cpa,
      icon: '🎓',
      color: 'text-purple-600',
    },
    {
      label: 'Enrolled Agents',
      value: stats.credentialCounts.ea,
      icon: '📋',
      color: 'text-orange-600',
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl p-8 border border-slate-200"
    >
      <h3 className="text-xl font-semibold text-slate-900 mb-6 text-center">
        Live Verification Stats
      </h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {counters.map((counter, index) => (
          <motion.div
            key={counter.label}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
            className="text-center"
          >
            <div className={`text-4xl font-bold ${counter.color} mb-1`}>
              {counter.value.toLocaleString()}
            </div>
            <div className="text-sm text-slate-600 font-medium">{counter.label}</div>
            <div className="text-2xl mt-1">{counter.icon}</div>
          </motion.div>
        ))}
      </div>
      <p className="text-xs text-slate-500 text-center mt-6">
        Updated in real-time from our database
      </p>
    </motion.div>
  );
}

