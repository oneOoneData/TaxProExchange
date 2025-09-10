'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Logo from '@/components/Logo';
import AdminRouteGuard from '@/components/AdminRouteGuard';

interface SignupData {
  date: string;
  signups: number;
}

interface AnalyticsData {
  signupsByDay: SignupData[];
  totalSignups: number;
  averageSignups: number;
  peakDay: number;
  period: string;
  debug?: {
    rawSignupCount: number;
    calculatedTotal: number;
  };
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState(30);

  useEffect(() => {
    loadAnalyticsData();
  }, [selectedPeriod]);

  const loadAnalyticsData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/analytics?days=${selectedPeriod}`);
      if (response.ok) {
        const result = await response.json();
        setData(result.data);
      }
    } catch (error) {
      console.error('Error loading analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getMaxSignups = () => {
    if (!data) return 0;
    return Math.max(...data.signupsByDay.map(day => day.signups));
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900 mx-auto"></div>
          <p className="mt-2 text-slate-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <AdminRouteGuard>
      <div className="min-h-screen bg-gradient-to-b from-white to-slate-50">
      {/* Header */}
      <header className="sticky top-0 z-30 backdrop-blur bg-white/70 border-b border-slate-200">
        <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
          <Logo />
          <nav className="flex items-center gap-6 text-sm text-slate-600">
            <Link href="/" className="hover:text-slate-900">Home</Link>
            <Link href="/admin" className="hover:text-slate-900">Admin</Link>
            <Link href="/admin/analytics" className="hover:text-slate-900 font-medium">Analytics</Link>
            <Link href="/admin/verify" className="hover:text-slate-900">Verify</Link>
            <Link href="/admin/profiles" className="hover:text-slate-900">Profiles</Link>
          </nav>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-semibold text-slate-900 mb-2">User Analytics</h1>
          <p className="text-slate-600">Track user signups and platform growth over time.</p>
        </div>

        {/* Period Selector */}
        <div className="mb-8">
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium text-slate-700">Time Period:</label>
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(parseInt(e.target.value))}
              className="px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={7}>Last 7 days</option>
              <option value={30}>Last 30 days</option>
              <option value={90}>Last 90 days</option>
            </select>
          </div>
        </div>

        {data && (
          <>
            {/* Summary Stats */}
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl border border-slate-200 p-6"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-600">Total Signups</p>
                    <p className="text-3xl font-semibold text-slate-900">{data.totalSignups}</p>
                    <p className="text-sm text-slate-500">in {data.period}</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white rounded-2xl border border-slate-200 p-6"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-600">Daily Average</p>
                    <p className="text-3xl font-semibold text-emerald-600">{data.averageSignups}</p>
                    <p className="text-sm text-slate-500">signups per day</p>
                  </div>
                  <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white rounded-2xl border border-slate-200 p-6"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-600">Peak Day</p>
                    <p className="text-3xl font-semibold text-orange-600">{data?.peakDay || 0}</p>
                    <p className="text-sm text-slate-500">signups in one day</p>
                  </div>
                  <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                    </svg>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Chart */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-2xl border border-slate-200 p-6"
            >
              <h3 className="text-lg font-semibold text-slate-900 mb-6">Signups Over Time</h3>
              
              {data.signupsByDay.length > 0 ? (
                <div className="space-y-4">
                  {/* Chart Bars */}
                  <div className="flex items-end justify-between h-64 px-2">
                    {data.signupsByDay.map((day, index) => {
                      const height = getMaxSignups() > 0 ? (day.signups / getMaxSignups()) * 200 : 0;
                      return (
                        <div key={day.date} className="flex flex-col items-center flex-1 mx-1">
                          <div className="w-full bg-slate-100 rounded-t-lg relative group">
                            <div
                              className="bg-gradient-to-t from-blue-500 to-blue-400 rounded-t-lg transition-all duration-300 hover:from-blue-600 hover:to-blue-500"
                              style={{ height: `${height}px` }}
                            />
                            {/* Tooltip */}
                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-slate-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                              {day.signups} signups
                            </div>
                          </div>
                          <div className="mt-2 text-xs text-slate-500 text-center">
                            {formatDate(day.date)}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Y-axis labels */}
                  <div className="flex justify-between text-xs text-slate-500 px-2">
                    <span>{getMaxSignups()}</span>
                    <span>{Math.round(getMaxSignups() * 0.75)}</span>
                    <span>{Math.round(getMaxSignups() * 0.5)}</span>
                    <span>{Math.round(getMaxSignups() * 0.25)}</span>
                    <span>0</span>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-slate-500">
                  <p>No signup data available for the selected period.</p>
                </div>
              )}
            </motion.div>

            {/* Recent Signups Table */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="mt-8 bg-white rounded-2xl border border-slate-200 p-6"
            >
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Recent Signups</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="text-left py-3 px-4 font-medium text-slate-600">Date</th>
                      <th className="text-left py-3 px-4 font-medium text-slate-600">Signups</th>
                      <th className="text-left py-3 px-4 font-medium text-slate-600">Trend</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.signupsByDay.slice(-10).reverse().map((day, index) => {
                      const previousDay = data.signupsByDay[data.signupsByDay.length - 10 + index - 1];
                      const trend = previousDay ? day.signups - previousDay.signups : 0;
                      
                      return (
                        <tr key={day.date} className="border-b border-slate-100">
                          <td className="py-3 px-4">{formatDate(day.date)}</td>
                          <td className="py-3 px-4 font-medium">{day.signups}</td>
                          <td className="py-3 px-4">
                            {trend > 0 && (
                              <span className="text-emerald-600 text-xs">↗ +{trend}</span>
                            )}
                            {trend < 0 && (
                              <span className="text-red-600 text-xs">↘ {trend}</span>
                            )}
                            {trend === 0 && (
                              <span className="text-slate-400 text-xs">→ 0</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </motion.div>
            
            {/* Debug Information */}
            {data?.debug && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4 mt-6"
              >
                <h4 className="text-sm font-medium text-yellow-800 mb-2">Debug Information</h4>
                <div className="text-xs text-yellow-700 space-y-1">
                  <p>Raw signup count from database: {data.debug.rawSignupCount}</p>
                  <p>Calculated total from daily breakdown: {data.debug.calculatedTotal}</p>
                  <p>Data consistency: {data.debug.rawSignupCount === data.debug.calculatedTotal ? '✅ Consistent' : '❌ Inconsistent'}</p>
                </div>
              </motion.div>
            )}
          </>
        )}
      </div>
    </div>
    </AdminRouteGuard>
  );
}

